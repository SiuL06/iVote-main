<template>
  <div id="app">
    <!-- Navbar -->
    <header>
      <div class="navbar">
        <RouterLink to="/" class="btn">iVOTE</RouterLink>
        <nav>
          <ul>
            <li><RouterLink to="/about" class="btn">About</RouterLink></li>
            <li><RouterLink to="/contact" class="btn">Contact</RouterLink></li>
          </ul>
        </nav>
      </div>
    </header>

    <!-- Main Content -->
    <main class="voters-section">
      <div class="content-wrapper">
        <!-- Logo -->
        <img src="@/assets/ivotelogo.png" alt="Logo" class="logo" />

        <!-- Header -->
        <h1 class="header">COMMISSION ON STUDENT ELECTIONS</h1>
        <h2 class="sub-header">VIEW NOMINEES</h2>

        <!-- Nominees Label -->
        <h2 class="nominees-label">Nominees:</h2>

        <!-- Nominee Cards -->
        <div class="nominees-container">
          <div v-for="nominee in nominees" :key="nominee.id" class="card">
            <input
              type="radio"
              v-model="selectedNominee"
              :value="nominee.name"
              class="radio-button"
            />
            <label class="nominee-title">{{ nominee.name }}</label>
          </div>
        </div>

        <!-- Submit Button -->
        <button class="btn submit-votes" @click="submitVote" :disabled="voted">Submit Vote</button>
      </div>
    </main>

    <!-- Footer -->
    <footer>
      <p>&copy; 2024 iVote. All rights reserved.</p>
    </footer>

    <!-- Message Button with Image -->
    <button class="message-button" @click="openMessage">
      <RouterLink to="/live"><img src="@/assets/message.png" alt="Message Icon" class="message-icon" /></RouterLink>
    </button>
  </div>
</template>


<script>
import { io } from "socket.io-client";
import { getFirestore, collection, addDoc } from "firebase/firestore";

export default {
  name: "ViewNomineesPage",
  data() {
    return {
      nominees: [], // List of nominees
      selectedNominee: "", // Selected nominee for voting
      voted: false, // Disable vote button after voting
      socket3000: null,
      socket3001: null,
      db: null,
    };
  },
  mounted() {
    // Initialize socket connections
    this.socket3000 = io("http://localhost:3000");
    this.socket3001 = io("http://localhost:3001");

    // Initialize Firestore
    this.db = getFirestore();

    // Listen for nominee updates from both socket servers
    this.socket3000.on("nomineeUpdate", (updatedNominees) => {
      this.nominees = updatedNominees;
    });

    this.socket3001.on("nomineeUpdate", (updatedNominees) => {
      this.nominees = updatedNominees;
    });

    // Listen for vote updates to update vote counts in real-time
    this.socket3000.on("voteUpdate", (updatedNominees) => {
      this.nominees = updatedNominees;
    });

    this.socket3001.on("voteUpdate", (updatedNominees) => {
      this.nominees = updatedNominees;
    });
  },
  methods: {
    async submitVote() {
      if (!this.selectedNominee) {
        alert("Please select a nominee to vote for.");
        return;
      }

      const voteData = {
        vote: this.selectedNominee,
        timestamp: new Date().toISOString(),
      };

      try {
        // Submit the vote to Firestore
        const votesCollection = collection(this.db, "votes");
        await addDoc(votesCollection, voteData);
        console.log("Vote submitted successfully");

        // Emit the vote data to both socket servers (3000 and 3001)
        this.socket3000.emit('voteCast', voteData);
        this.socket3001.emit('voteCast', voteData);

        // Disable the vote button after submission
        this.voted = true;

        alert("Your vote has been submitted successfully!");
      } catch (error) {
        console.error("Error submitting vote:", error);
        alert("Error submitting vote, please try again.");
      }
    },
    openMessage() {
      // Handle message button click (navigate to live page)
    }
  },
  unmount() {
    // Clean up socket connections when component is destroyed
    this.socket3000.disconnect();
    this.socket3001.disconnect();
  }
};
</script>

<style scoped>
/* General Reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: agrandir;
}

html,
body,
#app {
  height: 100%;
  width: 100%;
  font-family: Arial, sans-serif;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* Navbar */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  background-color: #fff;
  border-bottom: 2px solid #ddd;
  font-family: agrandir;
}

.navbar nav ul {
  list-style: none;
  display: flex;
}

.navbar nav ul li {
  margin-right: 20px;
  transition: 0.3s;
}

.navbar nav ul li:hover {
  opacity: .3;
}

.btn {
  background-color: white;
  font-size: 20px;
  color: black;
  text-decoration: none;
  padding: 0px 15px;
  border: 1px solid transparent;
  border-radius: 5px;
  transition: 0.3s ease;
}

/* Voters Section */
.voters-section {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  min-height: calc(86vh - 50px);
  background: linear-gradient(90deg, rgba(2, 0, 36, 1) 0%, rgba(9, 9, 121, 1) 35%, rgba(0, 212, 255, 1) 100%);
  color: white;
  text-align: center;
  font-family: agrandir;
  border-radius: 8px;
}

.content-wrapper {
  width: 90%;
  max-width: 1200px;
  flex-grow: 1;
  margin-bottom: 40px;
}

.logo {
  width: 200px;
  margin-bottom: 20px;
}

.header {
  font-size: 20px;
  margin-bottom: 10px;
}

.sub-header {
  font-size: 19px;
  margin-bottom: 30px;
}

.nominees-label {
  font-size: 15px;
  margin-bottom: 20px;
}

.nominees-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.card {
  background-color: #4a4a61;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
}

.radio-button {
  margin-bottom: 10px;
}

.nominee-title {
  font-size: 18px;
  margin-bottom: 10px;
}

.score {
  font-size: 24px;
  font-weight: bold;
}

.submit-votes {
  padding: 15px 25px;
  font-size: 18px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  background-color: #2D3038;
  color: white;
  transition: background-color 0.3s ease;
}

.submit-votes:hover {
  background-color: #131418;
}

/* Footer */
footer {
  background-color: #f8f9fa;
  padding: 15px;
  text-align: center;
  position: relative;
  width: 100%;
}

footer p {
  font-size: 14px;
  margin: 0;
  color: #555;
}

/* Message Button */
.message-button {
  position: fixed;
  bottom: 30px;
  right: 30px;
  background-color: #ffffff;
  color: white;
  padding: 15px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  transition: background-color 0.3s ease;
}

.message-button:hover {
  background-color: #0056b3;
}

.message-icon {
  width: 30px;
  height: 30px;
}

/* Responsive Image Sizes */
@media (max-width: 768px) {
  .message-icon {
    width: 25px;
    height: 25px;
  }
}
</style>
