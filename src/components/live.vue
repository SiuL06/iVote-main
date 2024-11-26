<template>
  <div class="container">
    <!-- Navbar -->
    <header>
      <div class="navbar">
        <RouterLink to="/landing" class="btn">iVOTE</RouterLink>
        <nav>
          <ul>
            <li><RouterLink to="/about" class="btn">About</RouterLink></li>
            <li><RouterLink to="/contact" class="btn">Contact</RouterLink></li>
            <li><a class="btn logout" @click="logout">Logout</a></li> <!-- Logout button -->
          </ul>
        </nav>
      </div>
    </header>

    <!-- Main Content -->
    <main>
      <section class="nominees">
        <div class="nominee" v-for="nominee in nominees" :key="nominee.id">
          <h2>{{ nominee.name }}</h2>
          <p>Votes: <span>{{ nominee.score }}</span></p>
        </div>
      </section>

      <section class="live-chat">
        <h2>Live Chat</h2>
        <div class="chat-box">
          <div class="chat-message"
               v-for="(message, index) in chatMessages"
               :key="index"
               :class="{ 'other-message': message.user !== username }">
            <strong>{{ message.user }}</strong>: <span>{{ message.message }}</span>
          </div>
        </div>
        <input type="text" v-model="newMessage" placeholder="Type your message..." />
        <button @click="sendMessage" class="send-btn">Send</button>
      </section>
    </main>

<!-- Logo Navigator -->
<RouterLink to="/voters" class="logo-link">
      <img src="@/assets/logo.png" alt="Logo" class="logo" />
    </RouterLink>
  </div>
</template>

<script>
import { io } from 'socket.io-client';
import { db } from '@/firebase'; // Adjust the path as necessary
import { collection, onSnapshot, addDoc, doc, getDoc } from 'firebase/firestore'; // For Firestore
import { getAuth, signOut } from 'firebase/auth'; // Import Firebase Auth

export default {
  name: 'LivePage',
  data() {
    return {
      nominees: [], // Array to store nominees and their vote counts
      chatMessages: [],
      newMessage: '',
      socket1: null,
      socket2: null,
      username: '', // Initialize username as empty
    };
  },
  async mounted() {
    const auth = getAuth();
    const userId = auth.currentUser  ? auth.currentUser .uid : null; // Get current user ID

    // Fetch the user's first name from Firestore
    await this.fetchUserName(userId);

    // Connect to both socket servers (ports 3000 and 3001)
    this.socket1 = io('http://localhost:3000'); // Listening on port 3000
    this.socket2 = io('http://localhost:3001'); // Listening on port 3001

    // Listen for nominee updates from both servers
    this.socket1.on('nomineeUpdate', (updatedNominees) => {
      console.log('Nominee data from socket1:', updatedNominees); // Log the data for debugging
      this.updateNomineeData(updatedNominees); // Update nominees from server 1
    });

    this.socket2.on('nomineeUpdate', (updatedNominees) => {
      console.log('Nominee data from socket2:', updatedNominees); // Log the data for debugging
      this.updateNomineeData(updatedNominees); // Update nominees from server 2
    });

    // Load existing chat messages from Firestore
    const chatCollection = collection(db, 'chatMessages'); // Reference to chatMessages collection in Firestore
    onSnapshot(chatCollection, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); // Retrieve messages
      console.log('Chat messages from Firestore:', messages); // Log the messages from Firestore
      this.updateChatMessages(messages); // Update chat messages without duplicates
    });

    // Listen for chat messages from both servers
    this.socket1.on('chatMessage', (messageData) => {
      this.updateChatMessages([messageData]); // Update chat messages with the new message from server 1
    });

    this.socket2.on('chatMessage', (messageData) => {
      this.updateChatMessages([messageData]); // Update chat messages with the new message from server 2
    });

    // Fetch nominees' votes from Firestore
    this.fetchNominees();
  },

  methods: {
    async fetchUserName(userId) {
      if (userId) {
        const userDoc = doc(db, 'users', userId); // Reference to the user document
        const userSnapshot = await getDoc(userDoc);

        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          this.username = userData.firstName || 'User '; // Set username to firstName or default to 'User '
        } else {
          console.error("No such user document!");
          this.username = 'User '; // Fallback username
        }
      } else {
        console.error("No authenticated user found!");
        this.username = 'User '; // Fallback if no user is authenticated
      }
    },

    async fetchNominees() {
      const votesCollection = collection(db, 'votes'); // Reference to votes collection in Firestore

      // Listen to real-time changes
      onSnapshot(votesCollection, (snapshot) => {
        let voteCounts = {}; // Initialize an empty object to store the vote counts

        snapshot.docs.forEach((doc) => {
          const nomineeName = doc.data().vote; // Assuming 'vote' field holds nominee's name

          // Increment the count for the nominee
          if (voteCounts[nomineeName]) {
            voteCounts[nomineeName] += 1;
          } else {
            voteCounts[nomineeName] = 1;
          }
        });

        // Convert the voteCounts object into an array of nominees with their vote counts
        const nominees = Object.keys(voteCounts).map(nomineeName => ({
          name: nomineeName,
          score: voteCounts[nomineeName],
        }));

        this.nominees = nominees; // Update nominees list with real-time vote counts
        console.log('Fetched and counted nominees from Firestore:', nominees); // Log the nominees with vote counts
      });
    },

    async sendMessage() {
      if (this.newMessage.trim()) {
        const messageData = {
          user: this.username, // Use the fetched username
          message: this.newMessage,
          timestamp: Date.now() // Add timestamp for ordering
        };

        // Emit chat message to both servers
        this.socket1.emit('chatMessage', messageData);
        this.socket2.emit('chatMessage', messageData);

        this.newMessage = ''; // Clear the input field

        // Save message to Firestore as well
        await this.saveMessageToFirestore(messageData);
      }
    },

    async saveMessageToFirestore(messageData) {
      const chatCollection = collection(db, 'chatMessages'); // Reference to chatMessages collection in Firestore
      try {
        await addDoc(chatCollection, messageData); // Add new message to Firestore
        console.log("Message saved successfully to Firestore");
      } catch (error) {
        console.error("Error saving message to Firestore:", error);
      }
    },

    updateNomineeData(updatedNominees) {
      // Ensure nominees are updated and log for debugging
      console.log('Updating nominees:', updatedNominees);
      this.nominees = updatedNominees.map(nominee => ({
        ...nominee,
        score: nominee.vote || 0 // Ensure there's a score property
      }));
    },

    updateChatMessages(newMessages) {
      newMessages.forEach((newMessage) => {
        const exists = this.chatMessages.some(message => message.timestamp === newMessage.timestamp && message.user === newMessage.user && message.message === newMessage.message);
        if (!exists) {
          this.chatMessages.push(newMessage); // Add the new message if it doesn't already exist
        }
      });
    },

    async logout() {
      const auth = getAuth();
      try {
        await signOut(auth); // Log the user out
        console.log('User  logged out successfully');
        this.$router.push('/'); // Redirect to the login page (adjust path as necessary)
      } catch (error) {
        console.error("Error logging out:", error);
      }
    }
  },

  beforeUnmount() {
    // Disconnect from both socket servers when the component is destroyed
    if (this.socket1) {
      this.socket1.disconnect();
    }
    if (this.socket2) {
      this.socket2.disconnect();
    }
  }
};
</script>

<style scoped>
* {
  font-family: agrandir;
  font-size: 18px;
}

/* Navbar styles */
/* Navbar styles */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center; /* Center items vertically */
  padding: 0 20px;
  padding-right: 30px;
  background-color: #fff; /* Secondary background for navbar */
  position: relative;
}

.navbar nav ul {
  list-style-type: none;
  display: flex; /* Use flexbox for the list */
  align-items: center; /* Align items vertically */
}

.navbar nav ul li {
  margin-right: 20px; /* Spacing between buttons */
}

/* Additional styles for the logout button if needed */
.logout {
  margin-left: auto; /* Pushes the logout button to the right */
}

/* Button styles for navbar */
.btn {
  background-color: transparent;
  border: none;
  color: #333;
  font-size: 20px;
  cursor: pointer;
  font-weight: bold;
  transition: 0.3s ease;
  text-decoration: none !important;
}

.btn:hover {
  opacity: .3;
}

/* Main Content Background */
main {
  background: linear-gradient(180deg, rgba(2,0,36,1) 0%, rgba(9,9,121,1) 35%, rgba(0,212,255,1) 100%);
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 20px;
  color: #2d3038;
}

/* Container layout for content only */
.container {
  padding: 20px;
  color: #2d3038;
  /* Removed background from container */
}

/* Header */
header {
  text-align: center;
  color: #fff;
  margin-bottom: 20px;
}

h1 {
  font-size: 26px;
  color: #fff;
  margin: 0;
}

/* Nominees Section */
.nominees {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin: 20px 0;
}

.nominee {
  background-color: #4a4a61;
  color: #fff;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  flex: 1 1 30%;
  text-align: center;
  transition: transform 0.3s, box-shadow 0.3s;
}

.nominee:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.nominee h2 {
  font-size: 20px;
  margin-bottom: 10px;
}

.nominee p {
  font-size: 16px;
  margin: 0;
}

/* Live Chat Section */
/* Live Chat Section */
.live-chat {
  margin-top: 30px;
  background-color: #ffffff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.live-chat h2 {
  font-size: 22px;
  color: #657FC7;
  margin-bottom: 15px;
  text-align: left;
}

.chat-box {
  height: 300px;
  overflow-y: auto;
  background-color: #f8f8f8;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Chat Message Bubbles */
.chat-message {
  padding: 10px 15px;
  border-radius: 20px;
  max-width: 75%;
  word-wrap: break-word;
  font-size: 16px;
  line-height: 1.4;
  position: relative;
  align-self: flex-start; /* Align messages to the left */
}

.chat-message::before {
  content: "";
  position: absolute;
  top: 12px;
  width: 0;
  height: 0;
  border: 6px solid transparent;
}

.other-message {
  background-color: #d1e7ff;
  align-self: flex-start; /* Align other messages to the left */
  border-radius: 12px 12px 0 12px;
}

.chat-message.other-message::before {
  border-right-color: #d1e7ff;
  right: -8px;
}

input[type="text"] {
  padding: 12px;
  width: calc(100% - 24px);
  margin: 15px 0;
  border: 1px solid #ccc;
  border-radius: 8px;
}

button {
  padding: 10px 15px;
  border: none;
  border-radius: 8px;
  background-color: #4CAF50;
  color: #fff;
  cursor: pointer;
  transition: 0.3s;
}
button:hover {
  background-color: #3a8b3c;
}

.logo-link {
  position: fixed; /* Fixed positioning */
  bottom: 20px; /* Distance from the bottom */
  right: 20px; /* Distance from the right */
  z-index: 1000; /* Ensure it's on top of other elements */
}

.logo {
  width: 30px;
  height: auto;
  cursor: pointer;
  border: 4px solid black;
  border-radius: 100px;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 10px;
  transition: transform 0.3s;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.logo:hover {
  transform: scale(1.1);
}

/* Media Queries for Responsiveness */
@media (max-width: 768px) {
  .navbar {
    flex-direction: row; /* Stack navbar items vertically */
    font-size: 15px;
  }

  .navbar nav ul {
    flex-direction: row; /* Stack nav items vertically */
    gap: 5px;
    align-items: flex-start; /* Align items to the start */
  }

  .navbar nav ul li {
    margin-left: auto; /* Adjust margin for vertical layout */
  }

  .nominee {
    flex: 1 1 100%; /* Full width on smaller screens */
  }

  .live-chat {
    padding: 15px; /* Adjust padding */
  }

  .chat-box {
    height: 200px; /* Reduce height for smaller screens */
  }

  input[type="text"] {
    width: calc(100% - 20px); /* Adjust width */
  }

  button {
    width: 100%; /* Full width for buttons */
  }
}

@media (max-width: 480px) {
  h1 {
    font-size: 22px; /* Smaller font size for headings */
  }

  .btn {
    font-size: 15px; /* Smaller button font size */
  }

  .nominee h2 {
    font-size: 18px; /* Smaller font size for nominee names */
  }

  .nominee p {
    font-size: 14px; /* Smaller font size for nominee scores */
  }

  .live-chat h2 {
    font-size: 20px; /* Smaller font size for chat heading */
  }
}
</style>
