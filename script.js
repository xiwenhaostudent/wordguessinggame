const API_URL = "https://random-word-api.herokuapp.com/word?number=1"
const MAX_GUESSES = 10

// Model - retrieve data, store data, modify data & update the View
class Model {
  constructor(apiUrl, maxGuesses) {
    this.apiUrl = apiUrl // URL to retrieve a random word
    this.maxGuesses = maxGuesses // Maximum number of guesses allowed
    this.wordToGuess = "" // The word that needs to be guessed
    this.hiddenWord = "" // the hidden word with underscores and the letters to be revealed
    this.guesses = [] // An array of letters guessed by the player
    this.wrongGuesses = 0 // The number of incorrect guesses made by the player
    this.correctCount = 0 // The number of correct words guessed by the player
    this.underLetters = [] // !!!!!
    this.timeLeft = 30 // New Feature
    this.timerId = null // New Feature
  }

  // Fetch a new word from the API and initialize the hidden word with random underscores
  async getWordToGuess () {
    const response = await fetch(this.apiUrl)
    const data = await response.json()
    // Retrieve a word from the API response data
    this.wordToGuess = data[0]
    console.log(this.wordToGuess)
    // Generate a random number of underscores to hide some letters of the word
    const numHiddenLetters = Math.floor(Math.random() * (this.wordToGuess.length - 1)) + 1
    // Generate an array of unique indices to hide letters of the word
    const hiddenLettersIndices = []
    while (hiddenLettersIndices.length < numHiddenLetters) {
      const index = Math.floor(Math.random() * this.wordToGuess.length)
      if (!hiddenLettersIndices.includes(index)) {
        hiddenLettersIndices.push(index)
      }
    }
    console.log(`hiddenLettersIndices: ${hiddenLettersIndices}`)
    // !!!!! Store the hidden letters in underLetters array
    this.underLetters = hiddenLettersIndices.map(index => this.wordToGuess[index])
    console.log(`this.underLetters: ${this.underLetters}`)
    // Construct the hidden word with underscores and the letters to be revealed
    let hiddenWord = ""
    for (let i = 0; i < this.wordToGuess.length; i++) {
      if (hiddenLettersIndices.includes(i)) {
        hiddenWord += "_"
      } else {
        hiddenWord += this.wordToGuess[i]
      }
    }
    this.hiddenWord = hiddenWord
    console.log(`this.hiddenWord: ${this.hiddenWord}`)
  }

  // !!!!! Check if the guessed letter is correct or incorrect, update the hidden word if the guess is correct
  checkGuess (letter) {
    if (this.underLetters.includes(letter)) { // Update the hidden word with the guessed letter
      for (let i = 0; i < this.wordToGuess.length; i++) {
        if (this.wordToGuess[i] === letter) {
          this.hiddenWord = this.hiddenWord.slice(0, i) + letter + this.hiddenWord.slice(i + 1)
        }
      }
      return true
    } else { // Increment the number of incorrect guesses
      this.wrongGuesses++
      return false // element ele_ent e:incorrect
    }
  }

  // Check if the word has been won, i.e., all letters have been guessed correctly
  isWordWon () {
    return !this.hiddenWord.includes("_")
  }

  // Check if the game is over, i.e., the number of wrong guesses has reached the maximum allowed
  isWordOver () {
    return this.wrongGuesses >= this.maxGuesses
  }

  // Reset the model to its initial state
  reset () {
    this.wordToGuess = ""
    this.hiddenWord = ""
    this.guesses = []
    this.wrongGuesses = 0
    this.correctCount = 0
    this.underLetters = [] // !!!
    this.timeLeft = 30 // New Feature
  }
}


// View - user interface
class View {
  constructor() { // DOM elements
    this.guessStats = document.querySelector(".guess-stats")
    this.hiddenLetters = document.querySelector(".hidden-letters")
    this.guessInput = document.querySelector("#guess-input")
    this.guessButton = document.querySelector("#guess-button")
    this.newGameButton = document.querySelector(".new-game-button")
    this.guessHistory = document.querySelector(".guess-history ul")
    this.timerDisplay = document.querySelector(".timer") // New Feature
  }

  // New Feature Update the timer display with the current time left 
  updateTimerDisplay (timeLeft) {
    this.timerDisplay.textContent = timeLeft
  }

  // Update the guess stats display with the number of wrong guesses
  updateGuessStats (wrongGuesses) {
    this.guessStats.textContent = `${wrongGuesses} / ${MAX_GUESSES}`
  }

  // Update the hidden word display with the current state of the hidden word
  updateHiddenWord (hiddenWord) {
    this.hiddenLetters.textContent = hiddenWord.split("").join(" ")
  }

  // Clear the guess input field
  clearGuessInput () {
    this.guessInput.value = ""
  }

  // Display the result of a guess in the guess history
  displayGuessResult (letter, isCorrect) {
    const li = document.createElement("li")
    li.textContent = letter.toUpperCase()
    if (isCorrect) {
      li.classList.add("correct")
    } else {
      li.classList.add("incorrect")
    }
    this.guessHistory.appendChild(li)
  }

  // Clear the guess history
  clearGuessHistory () {
    this.guessHistory.innerHTML = ""
  }
}


// Controller - manage data & handle users' actions
class Controller {
  constructor(model, view) {
    this.model = model
    this.view = view
    // Event listeners for guess and new game buttons
    this.view.guessButton.addEventListener("click", this.handleGuess.bind(this))
    this.view.guessInput.addEventListener("keydown", (event) => {
      if (event.keyCode === 13) {
        event.preventDefault()
        this.view.guessButton.click()
      }
    })
    this.view.newGameButton.addEventListener("click", this.handleNewGame.bind(this))
    // Start a new game
    this.newGame()
  }

  // New Feature Start the timer and update the view every second 
  startTimer () {
    this.model.timerId = setInterval(() => {
      if (this.model.timeLeft > 0) {
        this.model.timeLeft--
        this.view.updateTimerDisplay(this.model.timeLeft)
      } else if (this.model.timeLeft === 0) {
        clearInterval(this.model.timerId)
        alert("Time's up! Let's play a new game!")
        this.newGame()
      }
    }, 1000)
  }

  // Start a new game by resetting the model and updating the view
  async newGame () {
    this.model.reset()
    this.view.clearGuessInput()
    this.view.clearGuessHistory()
    await this.model.getWordToGuess()
    this.view.updateHiddenWord(this.model.hiddenWord)
    this.view.updateGuessStats(this.model.wrongGuesses)
    clearInterval(this.model.timerId) // New Feature
    this.startTimer() // New Feature
  }

  // Handle user's guess
  async handleGuess (event) {
    event.preventDefault()
    const letter = this.view.guessInput.value.toLowerCase()
    // Check if the input is valid
    if (!letter.match(/[a-z]/i)) {
      alert("Please enter a valid letter a-z or A-Z.")
      this.view.clearGuessInput()
      return
    }
    // Check if the letter has already been guessed
    if (this.model.guesses.includes(letter)) {
      alert(`You've already guessed the letter ${letter.toUpperCase()}. Please try a different letter.`)
      this.view.clearGuessInput()
      return
    }
    // Add the letter to the guesses list, check if it's correct, and update the view
    this.model.guesses.push(letter)
    const isCorrect = this.model.checkGuess(letter)
    this.view.displayGuessResult(letter, isCorrect)
    this.view.updateGuessStats(this.model.wrongGuesses)
    this.view.updateHiddenWord(this.model.hiddenWord)
    this.view.clearGuessInput()
    // If the current word is won, start a new word
    if (this.model.isWordWon() && this.model.wrongGuesses < MAX_GUESSES) {
      await this.model.getWordToGuess()
      this.view.updateHiddenWord(this.model.hiddenWord)
      this.view.clearGuessHistory()
      this.model.guesses = []
      this.model.correctCount++
    } else if (this.model.isWordOver()) { // If the game is over, display the score and start a new game
      const msg = `Game over! You have guessed ${this.model.correctCount} words!`
      alert(msg)
      this.newGame()
    }
  }

  // Handle new game button click
  handleNewGame (event) {
    event.preventDefault()
    this.newGame()
  }
}


// Create instances of the Model, View, and Controller classes
const model = new Model(API_URL, MAX_GUESSES)
const view = new View()
const controller = new Controller(model, view)