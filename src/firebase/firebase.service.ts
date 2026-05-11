import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private firestore: admin.firestore.Firestore;

  constructor(private configService: ConfigService) { }

  onModuleInit() {
    if (admin.apps.length === 0) {
      // Try both ConfigService and direct process.env
      const serviceAccountVar = 
        this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT') || 
        process.env.FIREBASE_SERVICE_ACCOUNT;

      if (serviceAccountVar) {
        try {
          const serviceAccount = JSON.parse(serviceAccountVar);
          
          if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
          }

          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
          console.log('[Firebase] Initialized successfully using environment variable.');
        } catch (error) {
          console.error('[Firebase] Error parsing FIREBASE_SERVICE_ACCOUNT:', error.message);
          throw error;
        }
      } else if (process.env.NODE_ENV === 'production') {
        // In production, we MUST have the environment variable
        const errorMsg = 'CRITICAL: FIREBASE_SERVICE_ACCOUNT environment variable is missing in production!';
        console.error(errorMsg);
        throw new Error(errorMsg);
      } else {
        // Local fallback (development only)
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
