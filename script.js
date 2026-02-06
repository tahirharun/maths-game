const difficulties = {
  easy: { min:1,max:10,ops:["+","-"] },
  medium: { min:5,max:20,ops:["+","-","*","/"] },
  hard: { min:10,max:50,ops:["+","-","*","/"] }
};
const TOTAL_QUESTIONS = 10;
const TOTAL_TIME = 15;

let score = 0, questionIndex = 0, level = "", timeLeft = TOTAL_TIME, timer=null, locked=false;

const correctSound = new Audio("correct.mp3");
const wrongSound = new Audio("wrong.mp3");
const timeoutSound = new Audio("timeout.mp3");
[correctSound, wrongSound, timeoutSound].forEach(s=>s.preload="auto");
let soundOn = localStorage.getItem("sound")!=="off";

function rand(min,max){return Math.floor(Math.random()*(max-min+1))+min;}
function shuffle(arr){return arr.sort(()=>Math.random()-0.5);}
function playSound(sound){if(!soundOn)return; sound.currentTime=0; sound.play().catch(()=>{});}
function toggleSound(){soundOn=!soundOn; localStorage.setItem("sound",soundOn?"on":"off"); document.querySelector(".sound-toggle").textContent = soundOn?"🔊":"🔇";}

const loginScreen = document.getElementById("login-screen");
const signupScreen = document.getElementById("signup-screen");
const difficultyScreen = document.getElementById("difficulty-screen");

document.getElementById("to-signup").onclick = ()=>{ loginScreen.style.display="none"; signupScreen.style.display="block"; };
document.getElementById("to-login").onclick = ()=>{ signupScreen.style.display="none"; loginScreen.style.display="block"; };
document.getElementById("login-form").onsubmit = e=>{
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  localStorage.setItem("loggedInUser", email);
  loginScreen.style.display="none";
  difficultyScreen.style.display="block";
};
document.getElementById("signup-form").onsubmit = e=>{
  e.preventDefault();
  const username = document.getElementById("signup-username").value;
  localStorage.setItem("loggedInUser", username);
  signupScreen.style.display="none";
  difficultyScreen.style.display="block";
};

function startGame(selectedLevel){
  level = selectedLevel; score=0; questionIndex=0;
  difficultyScreen.style.display="none";
  document.getElementById("result-screen").style.display="none";
  document.getElementById("quiz-screen").style.display="block";
  updateStars();
  toggleSound(); toggleSound(); 
  showQuestion();
}

function generateQuestion(){
  const {min,max,ops} = difficulties[level];
  let a=rand(min,max), b=rand(min,max), op=ops[rand(0,ops.length-1)];
  if(op==="/") a*=b;
  let answer; 
  if(op==="+") answer=a+b;
  if(op==="-") answer=a-b;
  if(op==="*") answer=a*b;
  if(op==="/") answer=a/b;
  answer = Number.isInteger(answer)?answer:+answer.toFixed(2);

  const options = new Set([answer]);
  while(options.size<4) options.add(answer+rand(-10,10));
  return { text:`${a} ${op} ${b}`, answer, options: shuffle([...options]) };
}

function showQuestion(){
  if(questionIndex>=TOTAL_QUESTIONS) return endGame();
  locked=false; clearInterval(timer);
  const q = generateQuestion();
  document.getElementById("question").textContent = `Q${questionIndex+1}: ${q.text}`;
  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML="";
  q.options.forEach(opt=>{
    const btn = document.createElement("button");
    btn.textContent=opt;
    btn.className="option-btn";
    btn.onclick = ()=> selectAnswer(opt,q.answer,btn);
    optionsDiv.appendChild(btn);
  });
  startTimer();
}

function startTimer(){
  timeLeft=TOTAL_TIME;
  const bar=document.getElementById("timer-bar");
  const text=document.getElementById("timer-text");
  bar.style.width="100%"; text.textContent=TOTAL_TIME;
  timer=setInterval(()=>{
    timeLeft-=0.1; bar.style.width=(timeLeft/TOTAL_TIME)*100+"%"; text.textContent=Math.ceil(timeLeft);
    if(timeLeft<=0){ 
      clearInterval(timer); 
      if(locked)return; 
      locked=true; 
      playSound(timeoutSound); 
      questionIndex++; 
      showQuestion(); 
    }
  },100);
}

function selectAnswer(selected,correct,btn){
  if(locked) return;
  locked=true; clearInterval(timer);
  document.querySelectorAll(".option-btn").forEach(b=>b.disabled=true);
  if(selected===correct){ score++; playSound(correctSound); btn.classList.add("correct"); }
  else{ playSound(wrongSound); btn.classList.add("wrong"); document.querySelectorAll(".option-btn").forEach(b=>{ if(+b.textContent===correct)b.classList.add("correct"); }); }
  updateStars();
  setTimeout(()=>{ questionIndex++; showQuestion(); },1000);
}

function updateStars(){
  document.getElementById("stars").textContent = "⭐".repeat(score)+"☆".repeat(TOTAL_QUESTIONS-score);
}

function endGame(){
  clearInterval(timer);
  document.getElementById("quiz-screen").style.display="none";

  const resultScreen = document.getElementById("result-screen");
  resultScreen.style.display="block";

  document.getElementById("final-score").textContent = score;
  let best = Number(localStorage.getItem("bestScore"))||0;
  if(score>best){ best=score; localStorage.setItem("bestScore",best); }
  document.getElementById("best-score").textContent=best;

  const username = localStorage.getItem("loggedInUser")||"Guest";
  saveScore(username, score);

  updateLeaderboard();

  if(score>=8) launchConfetti();
}

function saveScore(username,score){
  let scores = JSON.parse(localStorage.getItem("leaderboard"))||[];
  scores.push({username,score});
  scores.sort((a,b)=>b.score-a.score);
  scores = scores.slice(0,10);
  localStorage.setItem("leaderboard",JSON.stringify(scores));
}

function updateLeaderboard(){
  const leaderboardList = document.getElementById("leaderboard-list");
  leaderboardList.innerHTML = "";
  let scores = JSON.parse(localStorage.getItem("leaderboard"))||[];
  if(scores.length===0){ leaderboardList.innerHTML="<p>No scores yet!</p>"; }
  else{
    scores.forEach((s,i)=>{
      const div=document.createElement("div");
      div.className="leaderboard-entry";
      div.innerHTML=`<strong>#${i+1}</strong> ${s.username} - ⭐ ${s.score}`;
      leaderboardList.appendChild(div);
    });
  }
}

function restartGame(){
  document.getElementById("result-screen").style.display="none";
  difficultyScreen.style.display="block";
}

function launchConfetti(){
  const end = Date.now()+2000;
  const interval = setInterval(()=>{
    if(Date.now()>end) return clearInterval(interval);
    confetti({particleCount:100,spread:70,origin:{y:0.6}});
  },250);
}

document.addEventListener("click",()=>{
  correctSound.play().then(()=>correctSound.pause()).catch(()=>{});
},{once:true});

window.onload = ()=>{
  loginScreen.style.display="block";
  difficultyScreen.style.display="none";
};