
import * as jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

interface VerificationClaim {
    userId: number;
    expiration: number;
    exp: number;
  }


export const createVerificationToken = (userId: number): string  => {
     const exp = Math.floor(Date.now() / 1000) + 60 * 60;
    // 1分鐘後過期
    const expiration = Math.floor(Date.now() / 1000) + 60;

    const claim: VerificationClaim = {
      userId,
      expiration,
      exp,
    };

    const secretKey = process.env.SECRET_KEY;
    if (!secretKey) {
      throw new Error('Failed to get secret key');  ///
    }

    const token = jwt.sign(claim, secretKey, {
      algorithm: "HS256",
      expiresIn: '1h',
    });

    return token;
  }

  interface UserClaim {
    userId: number;
    userRole: 'student' | 'outsider' | 'admin' | 'assistant';
    exp: number;
  }
  
  function createUserToken(userId: number, userRole: 'student' | 'outsider' | 'admin' | 'assistant'): string {
    let duration : number  = 0;
    switch (userRole) {
      case 'student':
      case 'outsider':
        duration =  1 * 60 * 60; // 1小時
        break;
      case 'admin':
      case 'assistant':
        duration =  24 * 60 * 60; // 24小時
        break;
      default:
        throw new Error("Invalid user role");
    }

    const exp = Math.floor(Date.now() / 1000) + duration; // 設置過期時間
  
    const claim: UserClaim = {
      userId,
      userRole,
      exp,
    };
  
    const secretKey = process.env.SECRET_KEY;
    if (!secretKey) {
      throw new Error('Failed to get secret key');
    }
  
    const token = jwt.sign(claim, secretKey, {
      algorithm: "HS256",
      expiresIn: duration,
    });
  
    return token;
  }