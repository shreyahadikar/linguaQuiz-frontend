document.addEventListener('DOMContentLoaded', () => {
 
const loginModal = document.getElementById('loginModal');
const submitAuthBtn = document.getElementById('submitAuthBtn');
const toggleAuth = document.getElementById('toggleAuth');
const loginBtn = document.getElementById('loginBtn');
const userNameSpan = document.getElementById('userName');

const regName = document.getElementById('regName');
const regEmail = document.getElementById('regEmail');
const regPassword = document.getElementById('regPassword');
const formTitle = document.getElementById('formTitle');

let isLogin = true;
let userEmail = localStorage.getItem("userEmail");

// -------------------------
// AUTO LOGIN if already stored
// -------------------------
const savedEmail = localStorage.getItem("userEmail");
if (savedEmail) {
  userEmail = savedEmail;
  loginModal.style.display = "none";
  userNameSpan.innerText = savedEmail.split("@")[0];
}

// -------------------------
// OPEN LOGIN / SIGN-UP MODAL
// -------------------------
loginBtn.addEventListener("click", () => {
  loginModal.style.display = "flex";
});

// Close popup on outside click
loginModal.addEventListener("click", (e) => {
  if (e.target === loginModal) loginModal.style.display = "none";
});

// -------------------------
// TOGGLE LOGIN / SIGN-UP MODE
// -------------------------
toggleAuth.addEventListener("click", () => {
  isLogin = !isLogin;

  if (isLogin) {
    formTitle.innerText = "Login";
    submitAuthBtn.innerText = "Login";
    regName.style.display = "none";
    toggleAuth.innerHTML = `Don't have an account? <b>Sign up</b>`;
  } else {
    formTitle.innerText = "Sign Up";
    submitAuthBtn.innerText = "Sign Up";
    regName.style.display = "block";
    toggleAuth.innerHTML = `Already have an account? <b>Login</b>`;
  }
});

// -------------------------
// SUBMIT LOGIN or SIGN-UP
// -------------------------
submitAuthBtn.addEventListener("click", async () => {
  const name = regName.value.trim();
  const email = regEmail.value.trim();
  const password = regPassword.value.trim();

  if (!email || !password) {
    alert("Please enter email and password!");
    return;
  }

  try {
    let url;
    let body;

    if (isLogin) {
      // ===== LOGIN =====
      url = "https://linguaquiz-backend.onrender.com/api/login";
      body = { email, password };
    } else {
      // ===== SIGN UP =====
      if (!name) return alert("Name required!");
      url = "https://linguaquiz-backend.onrender.com/api/register";
      body = { name, email, password };
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
     const data = await res.json(); // Read JSON **once**
    if (!res.ok) {
      alert(data.message || "Login failed");
      return;
    }

    // SUCCESS
 // SUCCESS
localStorage.setItem("userEmail", email);
userEmail = email;
userNameSpan.innerText = email.split("@")[0];

loginModal.style.display = "none";

// Show success toast
if (isLogin) {
  showToast("✅ Logged in successfully!");
} else {
  showToast("🎉 Account created successfully!");
}

loadDashboard();

}catch (err) {
    console.error(err);
    showToast("⚠️ Something went wrong while connecting to the server.", true);
  }
});


 // SHOW SUCCESS POPUP ON SIGN UP
    // if (!isLogin) {
    //   document.getElementById("popupUserName").innerText = name;
    //   const popup = document.getElementById("successPopup");
    //   popup.classList.remove("hidden");

    //   document.getElementById("closePopup").onclick = () => {
    //     popup.classList.add("hidden");
    //   };
    // }

  async function loadDashboard() {
    if (!userEmail) return;

    try {
      // Fetch user overview (xp, level, streak)
      const res = await fetch(`https://linguaquiz-backend.onrender.com/api/dashboard/${userEmail}`);
      const data = await res.json();

      if (data.length > 0) {
        const xp = data[0].xp || 0;
        const level = data[0].level || "Beginner";
        const streak = data[0].streak || 0;

        document.getElementById("streakDisplay").innerText = `🔥 Streak: ${streak} days`;

        // Update all level/xp cards
        document.querySelectorAll(".card").forEach(card => {
          card.querySelector("p").innerText = `Level: ${level}`;
          card.querySelector(".xp-progress").style.width = `${Math.min(xp, 100)}%`;
        });
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
    }

    // --------------------------
    // LOAD PROGRESS FOR ALL LANGUAGES (lessons completed + progress bar)
    // --------------------------
    const allLanguages = [
      "Spanish","French","Hindi","Kannada","Tamil","Telugu",
      "Marathi","Malayalam","Bhojpuri","Rajasthani",
      "Punjabi","Korean","Kashmiri","Urdu"
    ];

    for (const lang of allLanguages) {
      const card = document.querySelector(`.card[data-lang="${lang}"]`);
      if (!card) continue;

      try {
        const res = await fetch(`https://linguaquiz-backend.onrender.com/api/progress/${userEmail}/${lang}`);
        const progress = await res.json();

        if (!progress || progress.lessonsCompleted === undefined || progress.totalLessons === undefined) continue;

        const completed = progress.lessonsCompleted;
        const total = progress.totalLessons;

        // Update lesson progress text
        const lessonText = card.querySelector(".lesson-progress");
        if (lessonText) lessonText.innerText = `Lessons: ${completed} / ${total}`;

        // Update progress bar fill width
        const lessonFill = card.querySelector(".lesson-fill");
        if (lessonFill) {
          const percent = total > 0 ? (completed / total) * 100 : 0;
          lessonFill.style.width = `${percent}%`;
        }
      } catch (err) {
        console.error(`Error fetching progress for ${lang}:`, err);
      }
    }
  }
  
  //toast function
  function showToast(msg, isError = false) {
  const toast = document.getElementById("toast");
  toast.innerText = msg;

  if (isError) toast.classList.add("error");
  else toast.classList.remove("error");

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}


  // Language card click handlers
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', async () => {
    if (!userEmail) {
      alert('Please login or sign up to continue!');
      loginModal.style.display = 'flex';
      return;
    }

    const lang = card.dataset.lang;

    // Fetch current lesson for this language
    let lessonIndex = 0;
    try {
      const res = await fetch(`https://linguaquiz-backend.onrender.com/api/progress/${userEmail}/${lang}`);
      const data = await res.json();
      lessonIndex = data.lessonsCompleted || 0; // start from 0 if no progress
    } catch(err) {
      console.error("Error fetching progress:", err);
    }

    // Go to quiz page with lesson index
    window.location.href = `quiz.html?lang=${lang}&email=${userEmail}&lesson=${lessonIndex}`;
  });
});


  loadDashboard();
});
