<template>
  <div id="main" class="constraint-layout">
    <img
      id="imageViewBackground"
      class="background-image"
      src="@/assets/facade1.png"
      alt="Background"
    />
    <div id="overlay" class="overlay"></div>
    <div class="login-container">
      <div class="logo-container">
        <img id="imageView3" class="logo" src="@/assets/ivotelogo.png" alt="iVote Logo" />
      </div>
      <input
        v-model="login"
        type="email"
        placeholder="Email"
        class="text-input"
      />
      <input
        v-model="password"
        type="password"
        placeholder="Password"
        class="text-input"
      />
      <div class="privacy-checkbox">
        <input
          v-model="agreeToPrivacyPolicy"
          type="checkbox"
          id="privacyPolicy"
        />
        <label for="privacyPolicy">I agree to the Privacy Policy</label>
      </div>
      <button class="login-button" @click="handleLogin">Login</button>

      <div id="recaptcha-container"></div>

      <div v-if="showPhoneInput">
        <input
          v-model="phoneNumber"
          type="tel"
          placeholder="Phone Number"
          class="text-input"
        />
        <button class="login-button" @click="sendVerificationCode">Send Verification Code</button>
      </div>

      <div v-if="showVerificationInput">
        <input
          v-model="verificationCode"
          type="text"
          placeholder="Enter Verification Code"
          class="text-input"
        />
        <button class="login-button" @click="verifyCode">Verify Code</button>
      </div>

      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

      <a href="#" class="register-link" @click="navigateToRegister">Register</a>
    </div>
  </div>
</template>

<script>
import { auth } from '@/firebase';
import { signInWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential } from 'firebase/auth'; // Add signInWithCredential
import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default {
  name: 'LoginPage',
  data() {
    return {
      login: '', // Email or login identifier
      password: '', // User password
      phoneNumber: '', // Phone number to verify
      verificationCode: '', // Code to verify the phone number
      agreeToPrivacyPolicy: false, // Privacy policy agreement flag
      showPhoneInput: false, // Flag to show phone input after login
      showVerificationInput: false, // Flag to show verification input
      confirmationResult: null, // Firebase phone auth confirmation result
      errorMessage: '', // Error message for displaying in UI
    };
  },
  methods: {
    // Setup reCAPTCHA widget
    setupRecaptcha() {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          'recaptcha-container', // The HTML container ID for reCAPTCHA
          {
            size: 'normal', // Invisible reCAPTCHA
            callback: () => {
              this.sendVerificationCode(); // Call the method to send the verification code
            },
            'expired-callback': () => {
              this.errorMessage = 'Please complete the reCAPTCHA again.'; // Handle reCAPTCHA expiration
            },
          },
          auth // Firebase Auth instance
        );
      }
    },

    // Handle login with email and password
    async handleLogin() {
      if (this.agreeToPrivacyPolicy) {
        try {
          // Try to sign in the user with email and password
          const userCredential = await signInWithEmailAndPassword(auth, this.login, this.password);
          console.log('User logged in:', userCredential.user);

          // Retrieve user data from Firestore based on UID
          const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
          if (userDoc.exists()) {
            this.phoneNumber = userDoc.data().phoneNumber;
            this.showPhoneInput = true; // Show phone input for verification
            this.setupRecaptcha(); // Setup reCAPTCHA widget
            console.log('Phone number retrieved:', this.phoneNumber);
          } else {
            this.errorMessage = 'No user data found in Firestore.';
          }

        } catch (error) {
          console.error('Error during login:', error);
          this.errorMessage = 'Error during login: ' + error.message;
        }
      } else {
        this.errorMessage = 'You must agree to the Privacy Policy to log in.';
      }
    },

    // Send phone number verification code via SMS
    async sendVerificationCode() {
      if (!this.phoneNumber) {
        this.errorMessage = 'Phone number is required to send the verification code.';
        return;
      }

      // Setup reCAPTCHA before sending the verification code
      this.setupRecaptcha();

      const appVerifier = window.recaptchaVerifier;
      try {
        // Send verification code via Firebase Auth
        const confirmationResult = await signInWithPhoneNumber(auth, this.phoneNumber, appVerifier);
        this.confirmationResult = confirmationResult;
        this.showVerificationInput = true; // Show the input for the user to enter the verification code
        this.errorMessage = ''; // Clear any previous error
        console.log('Verification code sent to', this.phoneNumber);
      } catch (error) {
        console.error('Error sending verification code:', error);
        this.errorMessage = 'Error sending verification code: ' + error.message;
      }
    },

    // Verify the code entered by the user
    async verifyCode() {
      if (!this.verificationCode) {
        this.errorMessage = 'Please enter the verification code.';
        return;
      }

      try {
        // Create a credential with the verification code and sign in
        const credential = PhoneAuthProvider.credential(
          this.confirmationResult.verificationId,
          this.verificationCode
        );

        // Sign in with the credential using Firebase Auth
        const userCredential = await signInWithCredential(auth, credential);
        console.log('User signed in successfully:', userCredential.user);
        alert('Phone number verified and user signed in!');
        this.$router.push('/landing'); // Redirect to the landing page after successful verification
      } catch (error) {
        console.error('Error verifying code:', error);
        this.errorMessage = 'Error verifying code: ' + error.message;
      }
    },

    // Navigate to the registration page
    navigateToRegister() {
      this.$router.push('/register');
    }
  }
};
</script>



<style scoped>
.error-message {
  color: red;
  margin-top: 10px;
}

* {
  font-family: agrandir;
}
@font-face {
  font-family: agrandir;
  src: url('@/assets/agrandir.otf');
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.constraint-layout {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #000;
}

.background-image {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
}

.login-container {
  z-index: 2;
  width: 100%;
  max-width: 400px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
}

.logo-container {
  margin-bottom: 20px;
  text-align: center;
}

.logo {
  width: 100%;
  max-width: 285px;
}

.text-input {
  width: 95%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.privacy-checkbox {
  width: 100%;
  margin-bottom: 16px;
  color: white;
  display: flex;
  align-items: center;
}

.privacy-checkbox label {
  margin-left: 8px;
}

.login-button {
  width: 100%;
  padding: 10px;
  margin-bottom: 15px;
  background-color: #747474;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.login-button:hover {
  background-color: #242424;
}

.register-link {
  color: white;
  cursor: pointer;
  text-decoration: none;
}

.register-link:hover {
  color: white;
  background-color: #33333386;
  padding: 1px 10px;
  border-radius: 2px;
}
</style>
