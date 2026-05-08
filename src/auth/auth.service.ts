import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FirebaseService } from '../firebase/firebase.service';
import * as bcrypt from 'bcrypt';
import { SigninDto, SignupDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private firebaseService: FirebaseService,
    private jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto) {
    const { email, password, name, birthdate, phoneNumber } = signupDto;
    const db = this.firebaseService.getDb();
    const usersRef = db.collection('users');

    // Check if user exists
    const userSnapshot = await usersRef.where('email', '==', email).get();
    if (!userSnapshot.empty) {
      throw new ConflictException('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save to Firestore
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
}
