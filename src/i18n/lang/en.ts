export default {
  system: 'NYCU Reservation System',
  navbar: {
    signIn: 'Sign In',
    signOut: 'Sign Out',
    profile: 'Profile',
    reservation: 'Reservation',
    title: 'Hi, {name}!'
  },
  signInModal: {
    title: 'Sign In',
    emailLabel: 'Email',
    emailPlaceholder: 'Please enter your email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Please enter your password',
    signUp: 'OutSider Sign Up',
    signIn: 'Sign In'
  },
  signUpModal: {
    title: 'Outsider Sign Up',
    name: 'Name',
    telphone: 'Phone',
    idCard: 'ID Card',
    email: 'Email',
    signUp: 'Sign Up',
    namePlaceholder: 'Please enter your name',
    telphonePlaceholder: 'Please enter your phone number',
    idCardPlaceholder: 'Please enter your ID card',
    emailPlaceholder: 'Please enter your email'
  },
  seat: {
    StairDoor: 'Stair Door',
    MainDoor: 'Main Door',
    MenToilet: "Men's Toilet",
    Elevator: 'Elevator',
    selectOthers: 'Please select other seats'
  },
  profileView: {
    personalData: 'Personal Data',
    reservationHistory: 'Reservation History',
    date: 'Date',
    beginTime: 'Start Time',
    endTime: 'End Time',
    seatId: 'Seat ID',
    actions: 'Actions',
    enterName: 'Enter Name',
    nameMaxLength: 'Name can have at most {max} characters',
    email: 'Email',
    emailTooltip: 'If you need to modify your email, please inform the administrator',
    name: 'Name',
    cancelChanges: 'Cancel Changes',
    saveChanges: 'Save Changes',

    cancel: 'Cancel Reservation',
    cancelSuccess: 'Reservation canceled successfully',
    cancelConfirmation:
      'Are you sure you want to cancel the reservation for seat {seatID} on {date} from {beginTime} to {endTime}?',

    terminate: 'Early Termination',
    terminateSuccess: 'Termination successful',
    terminateConfirmation: 'Are you sure you want to terminate early?',

    fetchProfileFailed: 'Failed to get personal data',
    saveChangesSuccess: 'Save changes successful',
    saveChangesFailed: 'Save changes failed'
  },
  bookingModel: {
    selectReservationTime: 'Please select reservation time',
    reserveSuccess: 'Reservation successful',

    reserveSeat: 'Reserve Seat {seatName}',
    reserveDate: 'Reserve Date',
    reserveTime: 'Reserve Time',
    notSelectedTime: 'Time not selected',
    reserve: 'Reserve',

    reserved: 'Reserved',
    notSelectable: 'Not Selectable',
    cancelSelection: 'Cancel Selection',
    select: 'Select',

    invalidTimeRange: 'Start time must be earlier than end time',
    oneTimeRange: 'Only one time range can be selected',
    cancelBookedSuccess: 'Reservation canceled successfully'
  },
  account: {
    unauthorized: 'Unauthorized',
    signInSuccess: 'Sign in successful',
    signOutSuccess: 'Sign out successful',
    signOutFailed: 'Sign out failed',
    needSignIn: 'Please sign in first',
    needAddDisplayName: 'You can modify your name in personal data',

    checkSignInFailed: 'Failed to check sign in status',

    updateSettingsSuccess: 'Update settings successful'
  },
  warning: 'Warning',
  confirm: 'Confirm',
  cancel: 'Cancel',
  available: 'Available',
  booked: 'Booked',
  partiallyBooked: 'Partially Booked',
  unavailable: 'Unavailable',

  filter: 'Start Filtering',

  U0001: 'Insufficient permissions',
  D0001: 'Data already exists',
  R0001: 'Not checked in yet',
  R0002: 'Start and end times must be on the same day',
  R0003: 'End time must be later than start time',
  R0004: 'Reservation start time must be later than the current time',
  R0005: 'Selected seat is not available',
  R0006: 'Reservation time overlaps with existing reservations',
  R0007: 'User has an unfinished reservation on the reservation day',
  R0008: 'Only reservations that have not yet started can be deleted',
  RS0001: 'Reservation time must be within the working hours on weekdays',
  RS0002: 'Reservation time must be within the opening hours on weekends',
  RS0003: 'Reservation time must be in {data} minute increments',
  RS0004: 'Reservation duration must be less than {data} hours',
  RS0005: 'Students can only make reservations up to {data} days in advance',
  RS0006: 'Non-school individuals can only make reservations up to {data} days in advance',
  RS0007: 'Reservation time overlaps with closed periods',
  P0001: 'Parameter format error',

  '42501': 'Insufficient Permissions',
  '23505': 'Data Already Exists',
  '23502': 'Some Required Fields Are Missing',
  '23503': 'Referenced External Data Does Not Exist',
  '23514': 'Data Does Not Meet Required Conditions',
  '22P02': 'Data Format Error',
  PGRST116: 'Insufficient Permissions',

  bad_json: 'Invalid JSON format',
  bad_jwt: 'Invalid JWT token',
  email_exists: 'Email address already exists',
  email_not_confirmed: 'Email address not confirmed',
  weak_password: 'Password is too weak',
  user_not_found: 'User not found',
  user_already_exists: 'User already exists',
  signup_disabled: 'Sign ups are disabled',
  session_not_found: 'Session not found',
  no_authorization: 'Authorization required',
  unexpected_failure: 'Unexpected failure occurred',
  over_email_send_rate_limit: 'Too many requests sent. Please try again later.',
  over_request_rate_limit: 'Too many requests sent. Please try again later.',
  over_sms_send_rate_limit: 'Too many requests sent. Please try again later.',
  captcha_failed: 'Captcha verification failed',
  reauthentication_needed: 'Reauthentication required',

  seat01: 'Start time and end time must either both be provided or both be omitted',
  seat02: 'seat not found',

  user01: 'user data not found',

  default: 'Unknown error, please try again later'
}
