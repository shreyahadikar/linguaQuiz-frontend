document.addEventListener('DOMContentLoaded', async () => {
function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel(); // reset before speaking
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

  // ------------------------------
  // GET LANGUAGE + EMAIL FROM URL
  // ------------------------------
  const urlParams = new URLSearchParams(window.location.search);
  const lang = urlParams.get('lang');
  const email = urlParams.get('email');


  if (!lang || !email) {
    alert("Invalid access. Returning to dashboard.");
    window.location.href = 'index.html';
    return;
  }
  localStorage.setItem("userEmail", email);
  const quizLangHeader = document.getElementById('quizLang');
  const questionsContainer = document.getElementById('questions');
  const submitBtn = document.getElementById('submitQuiz');
  const progressBar = document.getElementById('progress');
  const hintPopup = document.getElementById('hintPopup');

  quizLangHeader.innerText = `Quiz: ${lang}`;

  // ------------------------------
  // HINT POPUP FUNCTION
  // ------------------------------
  function showHint(message) {
    hintPopup.textContent = message;
    hintPopup.classList.add('show');
    setTimeout(() => hintPopup.classList.remove('show'), 2000);
  }

  // ------------------------------
  // FLOATING EMOJI FUNCTIONS
  // ------------------------------
  function showCorrectAnimation() {
    const emoji = document.createElement('div');
    emoji.className = 'correct-anim';
    emoji.textContent = '🎉';
    document.body.appendChild(emoji);
    setTimeout(() => emoji.remove(), 600);
  }

  function showWrongAnimation() {
    const emoji = document.createElement('div');
    emoji.className = 'wrong-anim';
    emoji.textContent = '❌';
    document.body.appendChild(emoji);
    setTimeout(() => emoji.remove(), 600);
  }

  // ------------------------------
  // FETCH QUESTIONS
  // ------------------------------
  let questions = [];
  try {
    const res = await fetch(`https://linguaquiz-backend.onrender.com/api/questions/${lang}`);
    questions = await res.json();
  } catch (err) {
    console.error(err);
    alert("Failed to load questions.");
  }

  // ------------------------------
  // RENDER QUESTIONS & INTERACTIVITY
  // ------------------------------
  questions.forEach((q, index) => {
    const div = document.createElement('div');
    div.classList.add('question', 'animate__animated', 'animate__fadeInUp');

    let optionsHtml = '';
    q.options.forEach(opt => {
      optionsHtml += `<button class="option">${opt}</button>`;
    });

    div.innerHTML = `
      <h3>Q${index + 1}: ${q.question}</h3>
      <div class="options">${optionsHtml}</div>
      <p class="hint" style="display:none; color:#ff9800; font-size:14px; margin-top:5px;"></p>
    `;

    questionsContainer.appendChild(div);
    const hintBox = div.querySelector('.hint');

    div.querySelectorAll('.option').forEach(button => {
      button.addEventListener('click', () => {
        // Disable all options
        div.querySelectorAll('.option').forEach(btn => btn.disabled = true);

        // Track the selected answer
        div.dataset.selected = button.textContent;

        if (button.textContent === q.answer) {
          button.classList.add('correct');
          speak("Correct");
          showCorrectAnimation();
        } else {
          button.classList.add('wrong');
          showWrongAnimation();

          // Show hint below question
          hintBox.textContent = "💡 Hint: " + q.hint;
          hintBox.style.display = "block";

          // Show hint popup at bottom
          showHint("Try again! The correct answer is highlighted.");

          const correctBtn = [...div.querySelectorAll('.option')]
            .find(b => b.textContent === q.answer);
          correctBtn.classList.add('correct');

          speak("Wrong. The correct answer is " + q.answer);
        }

        // Update progress
        const currentProgress = ((index + 1) / questions.length) * 100;
        progressBar.style.width = `${currentProgress}%`;
      });
    });
  });

  // // ------------------------------
  // // SUBMIT QUIZ
  // // ------------------------------
  // submitBtn.addEventListener("click", async () => {
  //   let score = 0;

  //   questions.forEach((q, index) => {
  //     const div = questionsContainer.children[index];
  //     if (div.dataset.selected === q.answer) {
  //       score++;
  //     }
  //   });

  //   try {
  //     const res = await fetch("http://localhost:3000/api/submit", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         email,
  //         score,
  //         lang
  //       })
  //     });

  //     const data = await res.json();

  //     if (!res.ok) {
  //       alert(data.message || "Failed to submit quiz.");
  //       return;
  //     }

  //     alert(
  //       `You scored ${score}/${questions.length}\n` +
  //       `Level: ${data.level}\n` +
  //       `XP: ${data.xp}`
  //     );

  //     setTimeout(() => {
  //       window.location.href = "index.html";
  //     }, 2000);

  //   } catch (error) {
  //     console.error(error);
  //     alert("Failed to submit quiz.");
  //   }
  // });
// ------------------------------
// SUBMIT QUIZ
// ------------------------------
submitBtn.addEventListener("click", async () => {
  let score = 0;

  questions.forEach((q, index) => {
    const div = questionsContainer.children[index];
    if (div.dataset.selected === q.answer) {
      score++;
    }
  });

  try {
    const res = await fetch("https://linguaquiz-backend.onrender.com/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        score,
        lang
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to submit quiz.");
      return;
    }

    // ---------- DISPLAY MODAL INSTEAD OF ALERT ----------
    const resultModal = document.getElementById('resultModal');
    const resultText = document.getElementById('resultText');

    // Suggestion based on score
    const percentage = (score / questions.length) * 100;
    let suggestion = "";
    if (percentage === 100) suggestion = "🎯 Perfect! You nailed it!";
    else if (percentage >= 70) suggestion = "👍 Good job! Keep practicing!";
    else if (percentage >= 40) suggestion = "🙂 Not bad, but try again for a higher score!";
    else suggestion = "😅 Don't give up! Review the hints and try again!";

    resultText.innerHTML = `
      <h3 class="score">${score}/${questions.length}</h3>
      <p class="xp">XP Earned: ${data.xp}</p>
      <p class="level">Level: ${data.level}</p>
      <p>${suggestion}</p>
      
    `;

    resultModal.style.display = "flex";

  } catch (error) {
    console.error(error);
    alert("Failed to submit quiz.");
  }
});

  // ------------------------------
  // COMPLETE LESSON
  // ------------------------------
  window.completeLesson = async function () {
    if (!email) return alert("No email found!");

    try {
      const res = await fetch("https://linguaquiz-backend.onrender.com/api/complete-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          gainedXP: 20,
          lang
        })
      });

      const data = await res.json();

      alert(`🎉 Lesson complete! XP: ${data.xp} | Level: ${data.level} | 🔥 Streak: ${data.streak}`);

      window.location.href = "index.html";

    } catch (err) {
      console.error(err);
      alert("Error completing lesson.");
    }
  };

});