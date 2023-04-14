const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const taskName = $('.add-name')
const taskHour = $('#add-time_hour')
const taskMinute = $('#add-time_minute')
const taskPri = $('#add-priority_input')
const taskDetail = $('.task-detail_wrapper')

const taskListElement = $('.task-list')
const taskDesc = $('.add-desc')
const taskList = JSON.parse(localStorage.getItem('taskList')) || []

const synth = window.speechSynthesis;
const utterance = new SpeechSynthesisUtterance();
utterance.lang = 'vi';
utterance.volume = 0;

//setup firebase
const firebaseConfig = { 
    apiKey: "AIzaSyAIeEJzEOEQGdQsVMWo7JrrDc-y2ZgJ-_A",
    authDomain: "todaydo-509f7.firebaseapp.com",
    projectId: "todaydo-509f7",
    storageBucket: "todaydo-509f7.appspot.com",
    messagingSenderId: "1062585547493",
    appId: "1:1062585547493:web:c27bbc0931b25190c6720c",
    measurementId: "G-XLPWYZF6KT"
}
firebase.initializeApp(firebaseConfig);
var database = firebase.database()    

const App = {
    handleTime() {
        _this = this
        const clockDiv = $('.clock')
        const dateDiv = $('.date')
        function time() {
            let d = new Date()
            let h = d.getHours()
            let m = d.getMinutes()
            let s = d.getSeconds()
            let day = d.getDay()
            let date = d.getDate()
            let month = d.getMonth()

            // handle date
            const dayObj = {
                0:  'Sunday',
                1:  'Monday',
                2:  'Tuesday',
                3:  'Wednesday',
                4:  'Thursday',
                5:  'Friday',
                6:  'Saturday',
            }
            const monthObj = {
                0:  'Jan',
                1:  'Feb',
                2:  'Mar',
                3:  'Apr',
                4:  'May',
                5:  'Jun',
                6:  'Jul',
                7:  'Aug',
                8:  'Sep',
                9:  'Oct',
                10:  'Nov',
                11:  'Dec',
            }
            dateDiv.innerHTML = `${dayObj[day]}, ${date} ${monthObj[month]}`
            
            // handle clock
            let hh = (h<10) ? `0${h}` : `${h}`
            let mm = (m<10) ? `0${m}` : `${m}`
            let ss = (s<10) ? `0${s}` : `${s}`
            clockDiv.textContent = `${hh}:${mm}:${ss}`

            // task over time

            // handle task time
            const comingTaskList = taskList.filter((task) => {
                const taskTime = task.hour * 10000 + task.minute * 100
                const realTime = h * 10000 + m * 100 + s
                
                // update task to firebase 
                if ((taskTime-realTime) === 0) {
                    _this.firebase(task)
                }

                return (taskTime > realTime)
            })
            if (comingTaskList.length > 0) {
                const taskUpcoming = comingTaskList[0]
                $('.upcoming-priority').style.display = 'block'
                $('.upcoming-priority').textContent = taskUpcoming.priority
                $('.upcoming-name').textContent = taskUpcoming.name
                $('.upcoming-time').textContent = `${taskUpcoming.hour}:${taskUpcoming.minute < 10 ? `0${taskUpcoming.minute}` : taskUpcoming.minute}`
                if (taskUpcoming.priority === 'normal')
                    $('.upcoming-priority').classList.remove('important')
                else
                    $('.upcoming-priority').classList.add('important')
            } else {
                $('.upcoming-priority').style.display = 'none'
                $('.upcoming-name').textContent = 'nothing to do ...'
                $('.upcoming-time').textContent = ``
            }

        }
        setInterval(time, 1000)
    },
    firebase(task) { 
        database.ref("/Task").update({
            "name": task.name,
            "hour": task.hour,
            "minute": task.minute,
            "duration": task.duration
        })
        console.log('firebase update');
    },
    sortTaskList(list) {
        list.sort((a, b) => {
            return a.hour - b.hour || a.minute - b.minute
        })
    },
    renderTasks(taskList) {        
        //render
        taskListElement.innerHTML =  ''
        this.sortTaskList(taskList)
        taskList.forEach((task, index) => {
            const taskElement = document.createElement('li')
            taskElement.className = `task ${task.isDone ? 'done' : ''} ${task.isOvertime ? 'overtime' : ''}`.trim()
            taskElement.setAttribute('data-index', index)
            taskElement.innerHTML = 
            `
            <div class="task-infor">
                <div class="task-specific">
                    <span class="task-time">
                        ${task.hour < 10 ? `0${task.hour}` : task.hour}:${task.minute < 10 ? `0${task.minute}` : task.minute}
                    </span>
                    <span class="task-priority task-priority--${task.priority}">${task.priority}</span>
                </div>
                <p class="task-name">${task.name}</p>
            </div>
            <div class="task-actions_wrapper">
                <span class="task-actions_overlay"></span>
                <ul class="task-actions_list">
                    <li class="task-action check"><i class='bx bx-check'></i></li>
                    <li class="task-action delete"><i class='bx bxs-trash-alt'></i></li>
                </ul>
                <div class="task-actions_btn">
                    <i class='bx bx-menu'></i>                            
                </div>
                <div class="task-actions_btn task-check_icon">
                    <i class='bx bx-check'></i>                            
                </div>
            </div>
            `

            taskElement.style.animationDelay = `${index * 0.2}s`
            taskListElement.appendChild(taskElement)
        })
    },
    filterTask(taskList, filter) {  
        const taskFilter = taskList.filter((task) => {
            return task.priority === filter
        })

        return taskFilter
    },
    addTask() {
        const newTask = {}
        
        let d = new Date()
        let h = d.getHours()
        let m = d.getMinutes()

        newTask.duration = 0
        newTask.name = taskName.value
        newTask.desc = taskDesc.value
        newTask.hour = Number(taskHour.value)
        newTask.minute = Number(taskMinute.value)
        newTask.priority = (taskPri.checked ? `important` : `normal`)
        newTask.isDone = false;
        newTask.isOvertime = Number(taskHour.value) > h ? false :  Number(taskMinute.value) < m

        taskList.push(newTask)
        
        taskName.value = ''
        taskDesc.value = ''
        taskHour.value = 0
        taskMinute.value = 0
        taskPri.checked = false
        
        const start = Date.now();
        console.log('play', newTask.name);
        utterance.text = newTask.name
        synth.speak(utterance);
        utterance.addEventListener('end', () => {
            const end = Date.now();
            const duration = (end - start) / 1000;
            taskList.forEach(task => {
                if (task.name === newTask.name && task.hour === newTask.hour) 
                    task.duration = Math.ceil(duration)
            })
                    
            // save taskList on localStorage
            localStorage.setItem('taskList', JSON.stringify(taskList))
            console.log(`Duration: ${duration} seconds`);
            console.log(taskList);
        });
    },
    handleActions(action, taskElement) {
        switch (action) {
            case 'check': {
                taskList[taskElement.dataset.index].done = !taskList[taskElement.dataset.index].done
                taskElement.classList.toggle('done')
                break;
            }
            case 'delete': {
                taskList.splice(taskElement.dataset.index, 1)
                this.renderTasks(taskList)
                break;
            }
            case 'showDetail': {
                const [task] = taskList.filter((task)=> {
                    return task.name === taskElement.querySelector('.task-name').textContent && taskElement.querySelector('.task-time').textContent.includes(`${task.hour}:`)
                })
                
                if (task.priority === 'important')
                    taskDetail.classList.add('important')
                else
                    taskDetail.classList.remove('important') 

                $('.task-detail_name').textContent = `${task.name}`
                $('.task-detail_time').textContent = taskElement.querySelector('.task-time').textContent
                $('.task-detail_desc').textContent = task.desc ? `${task.desc}` : 'task has no description...'
                taskDetail.classList.add('open')
                break;
            }
        }
    },
    handleEvents() {
        const _this = this
        // show / hide form
        const addForm = $('.add-form_wrapper')
        const addTaskBtn = $('#app .actions .add')
        const formEscBtn = $('.add-esc')
        const formOverlay = $('.form-overlay')

        const showForm = () => { addForm.classList.add('open') }
        const hideForm = () => { addForm.classList.remove('open') }

        addTaskBtn.onclick = showForm
        formEscBtn.onclick = hideForm
        formOverlay.onclick = hideForm
        taskDetail.onclick =() => {
            taskDetail.classList.remove('open')
        }
        // filter priority
        const normalPri = $('.option.normal')
        const importantPri = $('.option.important')
        const allPri = $('.option.all')

        normalPri.onclick = () => {
            const taskFilter = _this.filterTask(taskList, 'normal')
            _this.renderTasks(taskFilter)
        }
        importantPri.onclick = () => {
            const taskFilter = _this.filterTask(taskList, 'important')
            _this.renderTasks(taskFilter)
        }
        allPri.onclick = () => {
            _this.renderTasks(taskList)
        }

        // add Task
        const addBtn = $('.add-btn')
        const formInputs = $$('.add-form input')
        let isFill
        addBtn.onclick = () => {
            isFill = true
            // check input 
            for (let input of formInputs) {
                if ((!input.checkValidity())) {
                    input.classList.add('invalid')
                    isFill = false
                } else {
                    input.classList.remove('invalid')
                }
            }

            if (isFill) {
                _this.addTask()
                _this.renderTasks(taskList)
                hideForm()
            }
        }

        // task actions
        taskListElement.onclick = (e) => {
            const taskElement = e.target.closest('.task')
            const checkElement = e.target.closest('.task-action.check')
            const deleteElement = e.target.closest('.task-action.delete')

            if (taskElement && !checkElement && !deleteElement) {
                _this.handleActions('showDetail', taskElement)
            }
            if (checkElement) {
                _this.handleActions('check', taskElement)
            }

            if (deleteElement) {
                _this.handleActions('delete', taskElement)
            }
        } 
    },
    start() {   

        // 
        this.handleTime()
        this.renderTasks(taskList)
        this.handleEvents()
    }
}

App.start()



