import { useState, useEffect } from "react"
import Select from 'react-select'
import axios from 'axios'

const API_HOST = "https://opentdb.com/"
const API_CATEGORIES = new URL('api_category.php', API_HOST)
const API_QUESTIONS = new URL('api.php', API_HOST)

const getQuestions = async (c, d, a = 10) => {
  const apiUrl = `${API_QUESTIONS}?amount=${String(a)}${d != 'any' ? '&difficulty=' + d : null}${c != -1 ? '&category=' + String(c) : null}`
  console.log(apiUrl)
  return await axios.get(apiUrl).then(r => r.data)
}

const shuffleArray = (a) => a.sort(() => Math.random() - 0.5)

const DIFFICULTIES = ['Any', 'Easy', 'Medium', 'Hard'].map(v => ({
  label: v,
  value: v.toLocaleLowerCase()
}))

export function Question({ question, next }) {
  const [answers, setAnswers] = useState([])
  const [selectedAnswer, setSelectedAnswer] = useState("")

  const selectAnswer = (i) => {
    setSelectedAnswer(answers[i])
  }

  useEffect(() => {
    const answers = question.incorrect_answers
    answers.push(question.correct_answer)
    shuffleArray(answers)
    console.log(question)

    setSelectedAnswer("")
    setAnswers(answers)
  }, [question])

  const goToNext = () => next(selectedAnswer == question.correct_answer)

  return (
    <div className="question">
      <h3 dangerouslySetInnerHTML={{
        __html: question.question
      }}></h3>
      <hr />
      {answers.map((v, i) => selectedAnswer == "" ? (
        <button className="answer" key={i} onClick={() => selectAnswer(i)}>
          {v}
        </button>
      ) : (
        <button key={i} className={"answer " + (v == question.correct_answer ? "correct" : "wrong") + (v == selectedAnswer ? " selected" : "")}>
          {v}
        </button>
      ))}
      {selectedAnswer != "" && (
        <button className="next" onClick={goToNext} >
          Next
        </button>
      )}
    </div>
  )
}

export default function Home() {
  const [categories, setCategories] = useState()
  const [category, setCategory] = useState(-1)
  const [difficulty, setDifficulty] = useState('any')
  const [started, setStarted] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [questions, setQuestions] = useState(undefined)
  const [corrections, setCorrections] = useState([])

  useEffect(async () => {
    const d = await axios.get(API_CATEGORIES).then(r => r.data)
    console.log(d)
    const dParsed = [{
      value: -1,
      label: 'All Categories'
    }]

    dParsed.push(...d.trivia_categories.map(v => ({
      value: v.id,
      label: v.name
    })))
    setCategories(dParsed)
  }, [])

  const chosenCategory = ({ value }) => setCategory(value)
  const chosenDifficulty = ({ value }) => setDifficulty(value)

  const nextQuestion = (c) => {
    console.log(corrections)
    setCorrections([
      ...corrections,
      c
    ])
    setCurrentQuestion(currentQuestion + 1)
  }

  const startQuiz = async () => {
    const { results } = await getQuestions(category, difficulty)
    setQuestions(results)
    setStarted(true)
  }

  return (
    <div id="index-wrapper">
      <main>
        {!started && !questions ? (
          <>
            <h2 className="pb-4">Simple Trivia</h2>
            <Select className="mb-3" options={categories} onChange={chosenCategory} />
            <Select options={DIFFICULTIES} onChange={chosenDifficulty} />
            <button onClick={startQuiz} className="!rounded-md">
              Start
            </button>
          </>
        ) :
          currentQuestion < questions.length ? <Question question={questions[currentQuestion]} next={nextQuestion} />
            : (
              <>
                <h1 className="end">The End</h1>
                <p className="result">You scored {corrections.filter(v => v == true).length} <span>out of {questions.length}</span></p>
                <button className="w-2/4 rounded-md !bg-purple-500" onClick={() => window.location.reload(true)}>
                  Retry
                </button>
              </>
            )
        }
      </main>
    </div>
  )
}
