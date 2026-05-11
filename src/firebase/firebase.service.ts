import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private firestore: admin.firestore.Firestore;

  constructor(private configService: ConfigService) { }

  onModuleInit() {
    if (admin.apps.length === 0) {
      const serviceAccountVar = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT');

      if (serviceAccountVar) {
        try {
          const serviceAccount = JSON.parse(serviceAccountVar);

          if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
          }

          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
          console.log('[Firebase] Initialized using environment variable');
        } catch (error) {
          console.error('[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT env var:', error.message);
          throw error;
        }
      } else {
        // Local fallback (only for development)
        const serviceAccountPath = './firebase-service-account.json';
        console.log('[Firebase] Initializing using local file:', serviceAccountPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountPath),
        });
      }
    }
    this.firestore = admin.firestore();
  }

  getDb() {
    return this.firestore;
  }
}
