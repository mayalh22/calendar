function formatTime(date) {
  let h = date.getHours();
  let m = date.getMinutes();
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
}
function getWeekDates(startDate) {
  let dates = [];
  for(let i=0; i<7; i++) {
    let d = new Date(startDate);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
}
function getMonday(d) {
  d = new Date(d);
  let day = d.getDay();
  let diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}
const calendar = document.getElementById('calendar');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const timerDisplay = document.getElementById('timeDisplay');
const currentEventDisplay = document.getElementById('currentEvent');
const eventModal = document.getElementById('eventModal');
const eventForm = document.getElementById('eventForm');
const eventKeyInput = document.getElementById('eventKey');
const eventTitleInput = document.getElementById('eventTitle');
const eventCategorySelect = document.getElementById('eventCategory');
const eventDurationInput = document.getElementById('eventDuration');
const eventRepeatCheckbox = document.getElementById('eventRepeat');
const deleteBtn = document.getElementById('deleteBtn');
const cancelBtn = document.getElementById('cancelBtn');
const todoList = document.getElementById('todoList');
const todoItems = document.getElementById('todoItems');
const todoInput = document.getElementById('todoInput');
const openTodoBtn = document.getElementById('openTodo');
const closeTodoBtn = document.getElementById('closeTodo');
let currentMonday = getMonday(new Date());
let events = JSON.parse(localStorage.getItem('plannerEvents') || '{}');
let todos = JSON.parse(localStorage.getItem('plannerTodos') || '[]');
function isToday(date) {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function getRepeatingEvent(dayIndex, hour) {
  for (const key in events) {
    const event = events[key];
    if (event.repeat) {
      const parts = key.split('-');
          const dateParts = key.split('-');
      const originalDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      
      let originalDay = originalDate.getDay();
      const originalDayIndex = (originalDay === 0) ? 6 : originalDay - 1;

      if (originalDayIndex === dayIndex && parseInt(dateParts[3]) === hour) {
        return { event: event, key: key };
      }
    }
  }
  return null;
}
function renderCalendar() {
  calendar.innerHTML = '';
  const emptyCell = document.createElement('div');
  emptyCell.className = 'time-label';
  calendar.appendChild(emptyCell);
  const weekDates = getWeekDates(currentMonday);
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  weekDates.forEach((date, i) => {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'day-header';
    dayHeader.textContent = `${dayNames[i]} ${date.getDate()}/${date.getMonth()+1}`;
    if (isToday(date)) {
      dayHeader.classList.add('today');
    }
    calendar.appendChild(dayHeader);
  });

  for(let hour=6; hour <= 22; hour++) {
    const timeLabel = document.createElement('div');
    timeLabel.className = 'time-label';
    timeLabel.textContent = `${hour}:00`;
    calendar.appendChild(timeLabel);

    for(let day=0; day<7; day++) {
      const timeBlock = document.createElement('div');
      timeBlock.className = 'time-block';
      timeBlock.dataset.day = day;
      timeBlock.dataset.hour = hour;
      const dateStr = weekDates[day].toISOString().split('T')[0];
      timeBlock.dataset.date = dateStr;

      let currentEvent = null;
      let eventKey = null;
      let isContinuedEvent = false;

eventKey = getEventKey(dateStr, hour);
      currentEvent = events[eventKey];

      let repeatingEventInfo = null;
      if (!currentEvent) {
          repeatingEventInfo = getRepeatingEvent(day, hour);
          
          if (repeatingEventInfo) {
              currentEvent = repeatingEventInfo.event;
              timeBlock.dataset.isRepeating = 'true'; 
              eventKey = getEventKey(dateStr, hour);
          }
      }
      if (!currentEvent) {
        for (let h = 6; h < hour; h++) {
          const prevKey = getEventKey(dateStr, h);
          const prevEvent = events[prevKey];
          if (prevEvent && h + prevEvent.duration > hour) {
            currentEvent = prevEvent;
            eventKey = prevKey; 
            isContinuedEvent = true;
            break;
          }
        }
      }

      if(currentEvent) {
        timeBlock.classList.add(currentEvent.category || 'other');
        timeBlock.dataset.eventKey = eventKey;

        if (!isContinuedEvent) {
          timeBlock.textContent = currentEvent.title;
          timeBlock.classList.add('event-start');
        } else {
          timeBlock.classList.add('event-continued');
        }

        timeBlock.addEventListener('click', onTimeBlockClick);

      } else {
        timeBlock.addEventListener('click', onTimeBlockClick);
      }
            if (currentEvent && !isContinuedEvent) {
          timeBlock.style.gridRowEnd = `span ${currentEvent.duration}`;
      }
      
      calendar.appendChild(timeBlock);
    }
  }
}
function getEventKey(dateStr, hour) {
  return `${dateStr}-${hour}`;
}
function onTimeBlockClick(e) {
  const block = e.currentTarget;
  if (block.dataset.isRepeating === 'true' && !block.dataset.eventKey) {
    const dateStr = block.dataset.date;
    const hour = parseInt(block.dataset.hour);
    const repeatingEventInfo = getRepeatingEvent(parseInt(block.dataset.day), hour);
    if(repeatingEventInfo) {
        alert(`REPEATING EVENT: ${repeatingEventInfo.event.title}\nTo edit or delete this event, you must open the week it was originally created in.`);
    }
    return; 
  }
  const dateStr = block.dataset.date;
  const hour = parseInt(block.dataset.hour);
  const key = block.dataset.eventKey || getEventKey(block.dataset.date, parseInt(block.dataset.hour));
  const ev = events[key];
  if(ev) {
    eventKeyInput.value = key;
    eventTitleInput.value = ev.title;
    eventCategorySelect.value = ev.category;
    eventDurationInput.value = ev.duration || 1;
    eventRepeatCheckbox.checked = ev.repeat || false;
    deleteBtn.style.display = 'inline-block';
  } else {
    eventKeyInput.value = key;
    eventTitleInput.value = '';
    eventCategorySelect.value = 'work';
    eventDurationInput.value = 1;
    eventRepeatCheckbox.checked = false;
    deleteBtn.style.display = 'none';
  }
  eventModal.style.display = 'flex';
  eventTitleInput.focus();
}
eventForm.addEventListener('submit', e => {
  e.preventDefault();
  const key = eventKeyInput.value;
  const title = eventTitleInput.value.trim();
  const category = eventCategorySelect.value;
  const duration = parseInt(eventDurationInput.value) || 1;
  const repeat = eventRepeatCheckbox.checked;
  if(title === '') {
    alert('Event title cannot be empty');
    return;
  }
  events[key] = {title, category, duration, repeat};
  localStorage.setItem('plannerEvents', JSON.stringify(events));
  eventModal.style.display = 'none';
  renderCalendar();
});
deleteBtn.addEventListener('click', () => {
  const key = eventKeyInput.value;
  if(events[key]) {
    delete events[key];
    localStorage.setItem('plannerEvents', JSON.stringify(events));
    eventModal.style.display = 'none';
    renderCalendar();
  }
});
cancelBtn.addEventListener('click', () => {
  eventModal.style.display = 'none';
});
prevBtn.addEventListener('click', () => {
  currentMonday.setDate(currentMonday.getDate() - 7);
  renderCalendar();
});
nextBtn.addEventListener('click', () => {
  currentMonday.setDate(currentMonday.getDate() + 7);
  renderCalendar();
});
function updateTime() {
  const now = new Date();
  timerDisplay.textContent = formatTime(now);
  const dateStr = now.toISOString().split('T')[0];
  const hour = now.getHours();

  let currentEvent = null;

  for (let h = 6; h <= hour; h++) {
    const key = getEventKey(dateStr, h);
    const ev = events[key];
    if (ev && h + ev.duration > hour) {
      currentEvent = ev;
      break;
    }
  }

  if(currentEvent) {
    currentEventDisplay.textContent = `Current: ${currentEvent.title} (${currentEvent.category})`;
  } else {
    currentEventDisplay.textContent = 'No current event';
  }
}
function renderTodos() {
  todoItems.innerHTML = '';
  todos.forEach((todo, i) => {
    const li = document.createElement('li');
    li.textContent = todo;
    li.style.cursor = 'pointer';
    li.title = 'Click to remove';
    li.addEventListener('click', () => {
      todos.splice(i,1);
      saveTodos();
      renderTodos();
    });
    todoItems.appendChild(li);
  });
  openTodoBtn.style.display = todos.length > 0 ? 'inline-block' : 'none';
}
function saveTodos() {
  localStorage.setItem('plannerTodos', JSON.stringify(todos));
}
todoInput.addEventListener('keypress', e => {
  if(e.key === 'Enter') {
    const val = todoInput.value.trim();
    if(val) {
      todos.push(val);
      todoInput.value = '';
      saveTodos();
      renderTodos();
    }
  }
});
openTodoBtn.addEventListener('click', () => {
  todoList.style.display = 'block';
  openTodoBtn.style.display = 'none';
});
closeTodoBtn.addEventListener('click', () => {
  todoList.style.display = 'none';
  renderTodos();
});
renderCalendar();
renderTodos();
updateTime();
setInterval(updateTime, 1000);
eventModal.addEventListener('click', e => {
  if(e.target === eventModal) {
    eventModal.style.display = 'none';
  }
});
