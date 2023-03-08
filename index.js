const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const taskListElement = $('.task-list')
const taskDesc = $('.add-desc')
const taskList = []


//setup firebase
const firebaseConfig = { 
    apiKey: "AIzaSyAQuPuewOhAIyQnPKZSmecGU5yKm7nzvPo",
    authDomain: "do-an-1-74ead.firebaseapp.com",
    projectId: "do-an-1-74ead",
    storageBucket: "do-an-1-74ead.appspot.com",
    messagingSenderId: "207368436299",
    appId: "1:207368436299:web:fb556c68ae3735f3e96bce",
    measurementId: "G-4NFCJV5Q78"
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
                    console.log(task);
                    _this.firebase(task.name, task.hour, task.minute)
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
                console.log('no task coming');
                $('.upcoming-priority').style.display = 'none'
                $('.upcoming-name').textContent = 'nothing to do . . .'
                $('.upcoming-time').textContent = ``
            }

        }
        setInterval(time, 1000)
    },
    firebase(name, hour, minute) { 
        database.ref("/Task").update({
            "name": name,
            "hour": hour,
            "minute": minute,
        })
    },
    sortTaskList(list) {
        list.sort((a, b) => {
            return a.hour - b.hour || a.minute - b.minute
        })
        console.log('sorting list');
    },
    renderTasks(taskList) {        
        taskListElement.innerHTML =  ''
        this.sortTaskList(taskList)
        taskList.forEach((task, index) => {
            const taskElement = document.createElement('li')
            taskElement.className = `task ${task.isDone ? 'done' : ''} ${task.isOvertime ? 'overtime' : ''}`
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
                <span class="task-name">${task.name}</span>
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
        console.log('render ', taskList);
    },
    filterTask(taskList, filter) {  
        const taskFilter = taskList.filter((task) => {
            return task.priority === filter
        })

        console.log('filter ', taskFilter);
        return taskFilter
    },
    addTask() {
        const taskName = $('.add-name')
        const taskHour = $('#add-time_hour')
        const taskMinute = $('#add-time_minute')
        const taskPri = $('#add-priority_input')
        const newTask = {}

        newTask.name = taskName.value
        newTask.desc = taskDesc.value
        newTask.hour = taskHour.value
        newTask.minute = taskMinute.value
        newTask.priority = (taskPri.checked ? `important` : `normal`)
        newTask.isDone = false
        newTask.isOvertime = false
        taskList.push(newTask)
        
        taskName.value = ''
        taskDesc.value = ''
        taskHour.value = 0
        taskMinute.value = 0
        taskPri.checked = false

        console.log('add task', newTask);
    },
    handleActions(action, taskElement) {
        switch (action) {
            case 'check': {
                taskList[taskElement.dataset.index].done = !taskList[taskElement.dataset.index].done
                taskElement.classList.toggle('done')
                console.log('check action ', taskElement);
                break;
            }
            case 'delete': {
                taskList.splice(taskElement.dataset.index, 1)
                this.renderTasks(taskList)
                console.log('delete action ', taskElement);
                break;
            }
        }

        console.log('after action: ', taskList);
    },
    handleEvents() {
        const _this = this
        // show / hide form add task
        const addForm = $('.add-form_wrapper')
        const addTaskBtn = $('#app .actions .add')
        const formEscBtn = $('.add-esc')
        const formOverlay = $('.form-overlay')

        const showForm = () => { addForm.classList.add('open') }
        const hideForm = () => { addForm.classList.remove('open') }

        addTaskBtn.onclick = showForm
        formEscBtn.onclick = hideForm
        formOverlay.onclick = hideForm

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
                    console.log('invalid input: ', input.style);
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
            if (e.target.closest('.task-action.check')) {
                _this.handleActions('check', taskElement)
            }

            if (e.target.closest('.task-action.adjust')) {
                _this.handleActions('adjust', taskElement)
            }

            if (e.target.closest('.task-action.delete')) {
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