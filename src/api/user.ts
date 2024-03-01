import type { Response } from "./common";


type Sign = string


/**
 * Sign in user with email and password, returns a token stored in cookie
 *
 * @url  POST /api/signin
 * @param email
 * @param password
 * @returns usertoken
 */
export const signIn = (
  email: string,
  password: string
): Promise<Response<Sign>> => {

  try{
    /*
    query_user_by_email(email)
    *  404 => Response::new(status).with_message("用戶不存在"),
    *  _ => Response::new(Status::InternalServerError),
     
    let is_verify = verify(password, &(user.password_hash))

    if !is_verify {
      log::warn!("Password is incorrect");
      return Err(Response::new(Status::Unauthorized).with_message("密碼錯誤"));
    }

    if !user.verified {
      log::warn!("The user's email has not been verified");
      return Err(Response::new(Status::Unauthorized).with_message("email未驗證"));
    }
    */
  }
  catch(e){
    console.log(e);
  }

  /**ISSUE
  * 是否要把 send verification email 拆出去
  */

  throw new Error("Not implemented");
};

/**
 * @url  GET /api/users/verify?<verification_token>
 * @param verification_token
 * 
 */
export const verify_email = (verificationToken: string): Promise<Response<null>> => {

  try {
    /*
    verify_email(verification_token)
    */
  }
  catch(e){
    console.log(e);
  }

  
  throw new Error("Not implemented");
}


/**
 * Sign up student user with email and password, returns a token stored in cookie
 *
 * @url  POST /api/signup
 * @param email
 * @param password
 * @returns verification_token
 * @error email already exists
 */
export const studentSignUp = (
  email: string,
  password: string
): Promise<Response<Sign>> => {
  
  // console.log(`Starting user registration: Email: ${email}`);
  try{
    /*
    let password_hash = handle(hash(password, DEFAULT_COST), "Hashing password")
      .map_err(|status| Response::new(status))?;
    let verification_token = Uuid::new_v4().to_string();
    let verified = true;

    insert_user(
        email,
        &password_hash,
        user_role,
        verified,
        &verification_token,
      )

      *  409 => Response::new(status).with_message("用戶已經存在"),
      *  400 => Response::new(status).with_message("資料格式錯誤"),
      *  _ => Response::new(Status::InternalServerError),
      * 
    get user_id
    */
  }
  catch(e){
    console.log(e);
  }

  //  let token = create_verification_token(user.user_id)?;
  
  // console.log(`Completed user registration successfully: User: {user.user_id}`);
  throw new Error("Not implemented");
};

/**
 * Sign up outsides user with email and idcard, returns a token stored in cookie
 *
 * @url  POST /api/signup
 * @param name
 * @param phone
 * @param idcard
 * @param email
 * @returns verification_token
 */
export const outsiderSignUp = (
  name: string,
  phone: string,
  idcard: string,
  email: string
): Promise<Response<Sign>> => {
  throw new Error("Not implemented");
};

/**
 * Send verification email to the user
 * 
 * @url POST /api/sendVerificationEmail
 * @param email 
 */
export const sendVerificationEmail = (email: string): Promise<Response<Boolean>> => {
  /**ISSUE
   * 是否需要判斷冷卻時間(接收token)
    const now = Math.floor(Date.now() / 1000);
    if (now <= claim.expiration) {
      return false;
    }

  */
  
  
  throw new Error('Not implemented');
};

export interface User {
  id: string
  email: string
  role: 'student' | 'outsider' | 'admin' | 'assistant'
  name?: string
  phone?: string
  idCard?: string
  point: number
  ban?: {
    reason: string
    end: Date
  }
}

/**
 * Use token to get user information, token stored in cookie
 * Admin can get any user, user can only get themselves
 *
 * @url GET /api/user/:id
 * @param token
 * @returns user
 */
export const getUser = (): Promise<Response<User>> => {
  throw new Error('Not implemented')
}

/**
 * Get all users, only admin can use this
 *
 * @url GET /api/users?all=[Boolean]
 * @param token
 * @returns user[]
 */
export const getAllUsers = (): Promise<Response<User[]>> => {
  throw new Error('Not implemented')
}

/**
 * Ban a user, only admin can use this
 *
 * @url POST /api/user/:id/ban
 * @param id
 * @param reason
 * @param end
 * @returns Boolean
 */
export const banUser = (id: string, reason: string, end: Date): Promise<Response<Boolean>> => {
  throw new Error('Not implemented')
}

/**
 * Unban a user, only admin can use this
 *
 * @url DELETE /api/user/:id/ban
 * @param id
 * @returns Boolean
 */
export const unbanUser = (id: string): Promise<Response<Boolean>> => {
  throw new Error('Not implemented')
}

export const addPointUser = (id: string, point: number): Promise<Response<Boolean>> => {
  throw new Error('Not implemented')
}



/** ISSUE
 * 失敗回傳 false or error
 * 呼叫前會先判斷多少(token判斷?) 
 */



/**TODO
 * set_unavailable_timeslots
 * set_seat_info
 * 
 */