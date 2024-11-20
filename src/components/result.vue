<template>
  <div>
    <header>
      <nav>
        <div class="nav-left">
          <ul>
            <li><a href="/" style="color: #2D3038; text-decoration: none; font-family: agrandir;" class="homeBtn">iVOTE</a></li>
          </ul>
        </div>
        <div class="nav-right">
          <ul>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </div>
      </nav>
    </header>

    <main>
      <section class="content">
        <h2>Election Results</h2>
        <p>Your participation made a difference!</p>

        <!-- Handle loading state -->
        <div v-if="loading" class="loading">
          <p>Loading data...</p>
        </div>

        <!-- Handle error state -->
        <div v-if="errorMessage" class="error-message">
          <p>{{ errorMessage }}</p>
        </div>

        <!-- Display the winner's name and score -->
        <div v-if="winnerName" class="winner-details">
          <h3>{{ winnerName }} - {{ winnerScore }} votes</h3>
          <img v-if="winnerImage" :src="winnerImage" alt="Winner's Image" class="portrait">
        </div>

        <!-- Display all nominees and their scores -->
        <div v-if="allNominees.length > 0" class="nominee-list">
          <h4>All Nominees:</h4>
          <ul>
            <!-- Loop through nominees and display only name and score -->
            <li v-for="(nominee, index) in allNominees" :key="index">
              <strong>{{ nominee.name }}:</strong> {{ nominee.score }} votes
            </li>
          </ul>
        </div>

        <!-- Button to navigate to the details page -->
        <button v-if="winnerName" class="btn" @click="goToLive">View More Details</button>
      </section>
    </main>

    <footer>
      <p>&copy; 2024 iVote. All rights reserved.</p>
    </footer>
  </div>
</template>

<script>
import { db } from "@/firebase"; // Adjust the path based on your firebase.js location
import { doc, getDoc } from "firebase/firestore";

export default {
  name: "ResultsPage",
  data() {
    return {
      winnerName: '',
      winnerScore: 0,
      winnerImage: '',
      loading: true,
      errorMessage: '',
      allNominees: [] // This will hold all the nominees with their names and scores
    };
  },
  methods: {
    goToLive() {
      this.$router.push('/details'); // Adjust to navigate to the details page
    },
    async fetchVotes() {
      try {
        // Reference to the 'electionVotes' document
        const docRef = doc(db, "votes", "electionVotes");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const votesData = docSnap.data();

          // Initialize variables to track the highest score (winner)
          let highestScore = 0;
          let winner = null;

          // Initialize an array to store all nominees and their scores
          let nominees = [];

          // Iterate through all nominees and their vote counts
          for (const nominee in votesData) {
            const voteCount = votesData[nominee];
            nominees.push({ name: nominee, score: voteCount });

            // Track the nominee with the highest score
            if (voteCount > highestScore) {
              highestScore = voteCount;
              winner = nominee;
            }
          }

          // Set winner details
          this.winnerName = winner || 'No Winner';
          this.winnerScore = highestScore;
          // Assuming the winner's image filename is the same as the winner's name
          this.winnerImage = `path_to_images/${winner}.jpg`; // Adjust this path based on your storage

          // Set all nominees data
          this.allNominees = nominees;
          this.loading = false;
        } else {
          this.errorMessage = "No election data found.";
          this.loading = false;
        }
      } catch (error) {
        this.errorMessage = `Error fetching data: ${error.message}`;
        this.loading = false;
      }
    }
  },
  mounted() {
    this.fetchVotes();
  }
};
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: agrandir;
}

body {
  font-family: agrandir;
  background-color: #f4f4f4;
  color: #333;
}

header {
  background-color: #fff;
  color: #fff;
  padding: 10px 0;
  font-family: agrandir;
}

nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  padding-right: 50px;
  font-size: 20px;
  font-family: agrandir;
}

.homeBtn {
  font-size: 20px;
  font-weight: bold;
  transition: 0.2s ease;
}

.homeBtn:hover {
  cursor: pointer;
  opacity: .3;
}

.nav-left ul li {
  font-size: 30px;
  padding-left: 0px;
  list-style: none;
  text-decoration: none;
  margin: 0;
  color: #2D3038;
}

.nav-right ul {
  display: flex;
  list-style: none;
  gap: 20px;
}

.nav-right ul li a {
  color: #2D3038;
  text-decoration: none;
  transition: color 0.2s ease;
  font-family: agrandir;
}

.nav-right ul li a:hover {
  color: #ccc;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: rgb(2,0,36);
  background: linear-gradient(90deg, rgba(2,0,36,1) 0%, rgba(9,9,121,1) 35%, rgba(0,212,255,1) 100%);
  border-radius: 8px;
}

.content h2 {
  font-size: 25px;
  margin-bottom: 10px;
  color: white;
  text-align: center;
}

.content p {
  font-size: 18px;
  margin-bottom: 20px;
  color: white;
  text-align: center;
}

.content .btn {
  background-color: #383C47;
  color: #fff;
  padding: 10px 20px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-radius: 10px;
}

.content .btn:hover {
  background-color: #2D3038;
}

.portrait {
  max-width: 300px;
  height: auto;
  object-fit: contain;
  margin: 80px 0;
  border-radius: 8px;
}

.loading, .error-message, .no-winner-message {
  font-size: 18px;
  color: white;
  text-align: center;
  margin-top: 20px;
}

footer {
  text-align: center;
  margin-top: 20px;
  font-size: 12px;
  color: #555;
  font-family: Arial, Helvetica, sans-serif !important;
}

.nominee-list ul {
  list-style: none;
  padding-left: 0;
}

.nominee-list ul li {
  font-size: 18px;
  margin: 5px 0;
  color: white;
}
</style>
