'use strict';
(() => {
 let score=0;
 document.getElementById('calm-button').addEventListener('click',()=>document.getElementById('score').textContent='Score: '+(++score));
 document.getElementById('reset-calm').addEventListener('click',()=>{score=0;document.getElementById('score').textContent='Score: 0';});
 const board=document.getElementById('memory-board'),status=document.getElementById('game-status');
 const symbols=[['🌿','Leaf'],['🌻','Sunflower'],['🦋','Butterfly'],['🌙','Moon'],['🍀','Clover'],['🌸','Blossom']];
 let first=null,locked=false,moves=0,pairs=0,pending=null;
 function update(){document.getElementById('moves').textContent='Moves: '+moves;document.getElementById('pairs').textContent='Pairs: '+pairs+' / 6';}
 function hide(b){b.textContent='✦';b.classList.remove('revealed');b.setAttribute('aria-label',`Card ${b.dataset.position}, hidden`);b.setAttribute('aria-pressed','false');}
 function restart(){clearTimeout(pending);pending=null;first=null;locked=false;moves=0;pairs=0;update();status.textContent='Choose your first card.';board.replaceChildren();const deck=[...symbols,...symbols];for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}deck.forEach(([icon,name],i)=>{const b=MS.node('button',undefined,'memory-card');b.dataset.position=i+1;b.dataset.pair=name;hide(b);b.addEventListener('click',()=>{if(locked||b===first||b.classList.contains('matched'))return;b.textContent=icon;b.classList.add('revealed');b.setAttribute('aria-pressed','true');b.setAttribute('aria-label',`Card ${i+1}, ${name}`);if(!first){first=b;status.textContent='Choose another card.';return;}moves++;const previous=first;first=null;if(previous.dataset.pair===name){pairs++;[b,previous].forEach(x=>{x.classList.add('matched');x.setAttribute('aria-disabled','true');x.setAttribute('aria-label',x.getAttribute('aria-label')+', matched');});status.textContent=pairs===6?`Garden complete! You found all pairs in ${moves} moves.`:'A match! Find another pair.';}else{locked=true;status.textContent='Not a match. Take another look.';pending=setTimeout(()=>{hide(b);hide(previous);locked=false;pending=null;status.textContent='Choose your next pair.';},1000);}update();});board.append(b);});}
 document.getElementById('restart-memory').addEventListener('click',restart);restart();
})();


/* Number Recall and Missing Pattern games */
(() => {
  const byId = (id) => document.getElementById(id);

  // NUMBER RECALL
  const recallForm = byId('recall-form');
  if (recallForm) {
    const startBtn = byId('recall-start');
    const answerInput = byId('recall-answer');
    const display = byId('recall-number-display');
    const instruction = byId('recall-instruction');
    const feedback = byId('recall-feedback');
    const progress = byId('recall-progress-fill');
    let level = 1, score = 0, best = 0, sequence = '';
    let active = false, showing = false, roundToken = 0;

    try { best = Number(localStorage.getItem('mindspace-recall-best')) || 0; } catch (_) {}
    byId('recall-best').textContent = best;

    function updateRecallStats() {
      byId('recall-level').textContent = level;
      byId('recall-score').textContent = score;
      byId('recall-best').textContent = best;
      progress.style.width = Math.min(((level - 1) / 9) * 100, 100) + '%';
    }

    function startRecallRound() {
      const token = ++roundToken;
      active = true;
      showing = true;
      recallForm.hidden = true;
      answerInput.value = '';
      startBtn.hidden = true;
      feedback.textContent = '';
      instruction.textContent = 'Memorize the number sequence!';
      const length = Math.min(level + 2, 12);
      sequence = '';
      for (let i = 0; i < length; i++) sequence += Math.floor(Math.random() * 10);
      display.textContent = sequence;
      const displayTime = Math.min(1500 + length * 350, 5700);
      updateRecallStats();

      window.setTimeout(() => {
        if (token !== roundToken) return;
        display.textContent = '?';
        showing = false;
        instruction.textContent = 'Now enter the sequence from memory.';
        recallForm.hidden = false;
        answerInput.focus();
      }, displayTime);
    }

    startBtn.addEventListener('click', () => {
      level = 1;
      score = 0;
      startBtn.textContent = 'Try again';
      startRecallRound();
    });

    recallForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!active || showing) return;
      const answer = answerInput.value.trim();
      if (!/^\d+$/.test(answer)) {
        feedback.textContent = 'Please enter digits only.';
        return;
      }
      if (answer === sequence) {
        score += level * 10;
        level++;
        if (score > best) {
          best = score;
          try { localStorage.setItem('mindspace-recall-best', String(best)); } catch (_) {}
        }
        updateRecallStats();
        feedback.textContent = 'Correct! Great memory. 🌟';
        instruction.textContent = 'Preparing the next level…';
        recallForm.hidden = true;
        active = false;
        window.setTimeout(startRecallRound, 900);
      } else {
        active = false;
        ++roundToken;
        display.textContent = sequence;
        instruction.textContent = 'Round complete. Your final score is ' + score + '.';
        feedback.textContent = 'Not quite — the sequence was ' + sequence + '.';
        recallForm.hidden = true;
        startBtn.hidden = false;
        startBtn.textContent = 'Try again';
      }
    });
    updateRecallStats();
  }

  // MISSING PATTERN
  const patternOptions = byId('pattern-options');
  if (patternOptions) {
    const questions = [
      { prompt: '🌿　🌸　🌿　🌸　?', options: ['🌿', '🌸', '🌙', '🍀'], answer: '🌿', hint: 'The two shapes alternate.' },
      { prompt: '2　4　6　8　?', options: ['9', '10', '12', '14'], answer: '10', hint: 'Add 2 each time.' },
      { prompt: '🔵　🔵　🟡　🔵　🔵　?', options: ['🔵', '🟡', '🔺', '🟢'], answer: '🟡', hint: 'Two blue circles, then one yellow.' },
      { prompt: '1　3　5　7　?', options: ['8', '9', '10', '11'], answer: '9', hint: 'These are odd numbers, increasing by 2.' },
      { prompt: '⬆️　➡️　⬇️　⬅️　?', options: ['⬆️', '➡️', '⬇️', '⬅️'], answer: '⬆️', hint: 'The arrow turns clockwise.' },
      { prompt: '3　6　9　12　?', options: ['13', '14', '15', '18'], answer: '15', hint: 'Add 3 each time.' },
      { prompt: '🌙　⭐　⭐　🌙　⭐　⭐　?', options: ['🌙', '⭐', '☀️', '🌧️'], answer: '🌙', hint: 'The moon is followed by two stars.' },
      { prompt: '5　10　15　20　?', options: ['22', '24', '25', '30'], answer: '25', hint: 'Add 5 each time.' }
    ];
    let questionIndex = 0, patternScore = 0, answered = false;

    function renderPattern() {
      const q = questions[questionIndex];
      answered = false;
      byId('pattern-question-number').textContent = questionIndex + 1;
      byId('pattern-total').textContent = questions.length;
      byId('pattern-score').textContent = patternScore;
      byId('pattern-prompt').textContent = q.prompt;
      byId('pattern-hint').textContent = 'Choose the item that completes the pattern.';
      byId('pattern-feedback').textContent = '';
      byId('pattern-next').disabled = true;
      patternOptions.replaceChildren();
      q.options.forEach((option) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'pattern-option';
        button.textContent = option;
        button.setAttribute('aria-label', 'Choose ' + option);
        button.addEventListener('click', () => {
          if (answered) return;
          answered = true;
          [...patternOptions.children].forEach((b) => { b.disabled = true; });
          if (option === q.answer) {
            patternScore += 10;
            byId('pattern-score').textContent = patternScore;
            byId('pattern-feedback').textContent = 'Correct! You spotted the pattern. ✨';
            button.classList.add('correct');
          } else {
            byId('pattern-feedback').textContent = 'Good try! The correct answer is ' + q.answer + '.';
            button.classList.add('incorrect');
            [...patternOptions.children].find((b) => b.textContent === q.answer)?.classList.add('correct');
          }
          byId('pattern-hint').textContent = q.hint;
          byId('pattern-next').disabled = false;
          byId('pattern-next').textContent = questionIndex === questions.length - 1 ? 'See results' : 'Next question';
        });
        patternOptions.append(button);
      });
    }

    byId('pattern-next').addEventListener('click', () => {
      if (!answered) return;
      if (questionIndex < questions.length - 1) {
        questionIndex++;
        renderPattern();
      } else {
        byId('pattern-prompt').textContent = '🌱';
        byId('pattern-hint').textContent = 'You completed all the patterns!';
        byId('pattern-feedback').textContent = 'Final score: ' + patternScore + ' / ' + (questions.length * 10) + '.';
        patternOptions.replaceChildren();
        byId('pattern-next').hidden = true;
      }
    });

    byId('pattern-restart').addEventListener('click', () => {
      questionIndex = 0;
      patternScore = 0;
      byId('pattern-next').hidden = false;
      byId('pattern-next').textContent = 'Next question';
      renderPattern();
    });
    renderPattern();
  }
})();


/* Additional games: Simon Sequence and Find the Leaf */
(() => {
 const $=id=>document.getElementById(id);
 const simonBoard=$('simon-board');
 if(simonBoard){
  const buttons=[...simonBoard.querySelectorAll('[data-simon]')];let sequence=[],step=0,level=0,best=0,locked=true,run=0;
  try{best=Number(localStorage.getItem('mindspace-simon-best'))||0}catch(_){}
  $('simon-best').textContent=best;
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  async function flash(index,token){if(token!==run)return;buttons[index].classList.add('simon-lit');await wait(430);buttons[index].classList.remove('simon-lit');await wait(170)}
  async function showSequence(token){locked=true;$('simon-status').textContent='Watch the sequence…';await wait(450);for(const n of sequence){if(token!==run)return;await flash(n,token)}if(token===run){locked=false;step=0;$('simon-status').textContent='Your turn — repeat the sequence.'}}
  $('simon-start').addEventListener('click',()=>{run++;sequence=[];step=0;level=0;locked=true;$('simon-level').textContent='0';$('simon-status').textContent='Get ready…';next()});
  async function next(){level++;$('simon-level').textContent=level;sequence.push(Math.floor(Math.random()*4));await showSequence(run)}
  buttons.forEach((b,i)=>b.addEventListener('click',async()=>{if(locked)return;await flash(i,run);if(i!==sequence[step]){locked=true;$('simon-status').textContent='Sequence ended at level '+level+'. Try again!';if(level-1>best){best=level-1;$('simon-best').textContent=best;try{localStorage.setItem('mindspace-simon-best',String(best))}catch(_){}}return}step++;if(step===sequence.length){locked=true;$('simon-status').textContent='Nice memory! Next level…';await wait(650);next()}}));
 }
 const leafBoard=$('leaf-board');
 if(leafBoard){let round=0,score=0,active=false;const symbols=['🍃','🌸','🍀','🌼','🍂','🌱','🌻','🌷','🌵'];function makeRound(){leafBoard.replaceChildren();active=true;const target=Math.floor(Math.random()*9);symbols.forEach((symbol,i)=>{const b=document.createElement('button');b.type='button';b.className='leaf-choice';b.textContent=i===target?'🌿':symbol;b.setAttribute('aria-label',i===target?'Find the green leaf':'Other symbol');b.addEventListener('click',()=>{if(!active)return;active=false;if(i===target){score++;$('leaf-status').textContent='You found it! Take a breath, then continue.'}else{$('leaf-status').textContent='Good try. Look for the simple green leaf.'} $('leaf-round').textContent=round;$('leaf-score').textContent=score;[...leafBoard.children].forEach(x=>x.disabled=true);$('leaf-start').textContent='Next round'});leafBoard.append(b)})}
 $('leaf-start').addEventListener('click',()=>{round++;$('leaf-round').textContent=round;makeRound();$('leaf-status').textContent='Find the green leaf.';$('leaf-start').textContent='New round'});
 }
})();
