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
        const serviceAccount = JSON.parse(serviceAccountVar);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else {
        const serviceAccountPath = './firebase-service-account.json';
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
