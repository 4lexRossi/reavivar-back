import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { FirebaseService } from '../firebase/firebase.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { SigninDto, SignupDto, ForgotPasswordDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private firebaseService: FirebaseService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) { }

  async signup(signupDto: SignupDto) {
    const { email, password, name, birthdate, phoneNumber } = signupDto;
    const db = this.firebaseService.getDb();
    const usersRef = db.collection('users');

    const userSnapshot = await usersRef.where('email', '==', email).get();
    if (!userSnapshot.empty) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      email,
      password: hashedPassword,
      name,
      birthdate,
      phoneNumber: phoneNumber || null,
      createdAt: new Date().toISOString(),
    };

    const docRef = await usersRef.add(newUser);
    return {
      id: docRef.id,
      email,
      name,
      birthdate,
      phoneNumber,
    };
  }

  async signin(signinDto: SigninDto) {
    const { email, password } = signinDto;
    const db = this.firebaseService.getDb();
    const usersRef = db.collection('users');

    const userSnapshot = await usersRef.where('email', '==', email).get();
    if (userSnapshot.empty) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userData = userSnapshot.docs[0].data();
    const isPasswordValid = await bcrypt.compare(password, userData.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: userSnapshot.docs[0].id, email: userData.email };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: userSnapshot.docs[0].id,
        email: userData.email,
        name: userData.name,
      },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    // Start background process without awaiting
    this.handleForgotPasswordBackground(email);

    return {
      message: 'Você receberá um e-mail de recuperação em instantes, caso conste em nosso cadastro, caso não receba crie uma nova conta.'
    }
  }

  private async handleForgotPasswordBackground(email: string) {
    try {
      const db = this.firebaseService.getDb();
      const usersRef = db.collection('users');

      const userSnapshot = await usersRef.where('email', '==', email).get();

      if (userSnapshot.empty) {
        return;
      }

      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

      const resetRef = db.collection('password_resets');
      await resetRef.doc(token).set({
        email,
        expiresAt: expiresAt.toISOString(),
        used: false,
        createdAt: new Date().toISOString(),
      });

      const resetLink = `https://reavivar.app/reset-password?token=${token}`;

      await this.mailService.sendPasswordResetEmail(email, resetLink);
      console.log(`[Background] Password reset email sent with token to: ${email}`);
    } catch (error) {
      console.error(`[Background] Error processing forgot password for ${email}:`, error);
    }
  }
}
