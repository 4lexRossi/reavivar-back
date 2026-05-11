import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;

  constructor(private configService: ConfigService) {
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
  }

  async sendPasswordResetEmail(email: string, resetLink: string) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.configService.get<string>('MAIL_FROM') || 'onboarding@resend.dev',
        to: [email],
        subject: 'Recuperação de Senha - Reavivar',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #5C66DE;">Recuperação de Senha</h2>
            <p>Olá,</p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta no Reavivar.</p>
            <p>Para prosseguir, clique no botão abaixo:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #5C66DE; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Redefinir Senha</a>
            </div>
            <p>Se você não solicitou isso, pode ignorar este e-mail.</p>
            <p>Atenciosamente,<br>Equipe Reavivar</p>
          </div>
        `,
      });

      if (error) {
        console.error('Resend Error:', error);
      }

      return data;
    } catch (e) {
      console.error('MailService Error:', e);
    }
  }
}
