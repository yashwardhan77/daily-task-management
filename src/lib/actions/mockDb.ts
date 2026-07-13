import fs from 'fs'
import path from 'path'

// Database file path: D:\daily task management\src\lib\actions\tasks_db.json
const DB_FILE_PATH = path.join(process.cwd(), 'src/lib/actions/tasks_db.json')

export interface Employee {
  id: string
  name: string
  role: string
  passwordHash: string // simple cleartext for mock, or md5/sha
}

export interface TaskLog {
  id: string
  employeeId: string
  date: string // YYYY-MM-DD
  status: 'Full Day' | 'Half Day' | 'Holiday' | 'Pending'
  description: string
  descriptionBefore?: string
  descriptionAfter?: string
  hours: number
  hoursBefore?: number
  hoursAfter?: number
  submittedAt: string // ISO timestamp
}

// Fixed list of 15 Vidhya Bharati Sewadham employees
export const EMPLOYEES: Employee[] = [
  { id: 'VB01', name: 'Ramesh Chandra Joshi', role: 'Pradhan Acharya (Principal)', passwordHash: 'sewadham123' },
  { id: 'VB02', name: 'Sunita Mishra', role: 'Senior Teacher', passwordHash: 'sewadham123' },
  { id: 'VB03', name: 'Alok Kumar Trivedi', role: 'Science Teacher', passwordHash: 'sewadham123' },
  { id: 'VB04', name: 'Anil Kumar Sharma', role: 'Maths Teacher', passwordHash: 'sewadham123' },
  { id: 'VB05', name: 'Rajesh Soni', role: 'Office Coordinator', passwordHash: 'sewadham123' },
  { id: 'VB06', name: 'Manoj Patidar', role: 'Computer Instructor', passwordHash: 'sewadham123' },
  { id: 'VB07', name: 'Sarita Vyas', role: 'Primary Teacher', passwordHash: 'sewadham123' },
  { id: 'VB08', name: 'Deepak Chouhan', role: 'Physical Trainer (P.T.I)', passwordHash: 'sewadham123' },
  { id: 'VB09', name: 'Nirmala Sen', role: 'Music & Arts Teacher', passwordHash: 'sewadham123' },
  { id: 'VB10', name: 'Gopal Lal Verma', role: 'Librarian', passwordHash: 'sewadham123' },
  { id: 'VB11', name: 'Kamlesh Mewada', role: 'Accounts Administrator', passwordHash: 'sewadham123' },
  { id: 'VB12', name: 'Vijay Rathore', role: 'Store Keeper', passwordHash: 'sewadham123' },
  { id: 'VB13', name: 'Sanjay Solanki', role: 'Support Staff / Sewadar', passwordHash: 'sewadham123' },
  { id: 'VB14', name: 'Rekha Choudhary', role: 'Support Staff / Sewadar', passwordHash: 'sewadham123' },
  { id: 'VB15', name: 'Pawan Kumar Soni', role: 'System Administrator', passwordHash: 'sewadham123' },
]

// Admin Credentials
export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'adminpassword123',
  name: 'Prabandhak (Manager)'
}

// Initialise DB file if it doesn't exist
function initDb() {
  if (!fs.existsSync(DB_FILE_PATH)) {
    const initialData: TaskLog[] = []
    // Seed some mock task data for the last 3 days to make the admin dashboard look rich out-of-the-box
    const today = new Date()
    for (let i = 1; i <= 3; i++) {
      const d = new Date()
      d.setDate(today.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      
      // Let's seed for employees
      EMPLOYEES.forEach((emp, index) => {
        // Randomise status: mostly Full Day, occasionally Half Day or Holiday
        let status: 'Full Day' | 'Half Day' | 'Holiday' = 'Full Day'
        let hours = 8
        let desc = ''
        let descriptionBefore = ''
        let descriptionAfter = ''
        let hoursBefore = 4
        let hoursAfter = 4
        
        const rand = (index + i) % 10
        if (rand === 2) {
          status = 'Half Day'
          hours = 4
          hoursBefore = 4
          hoursAfter = 0
          descriptionBefore = 'Conducted parent-teacher meetings and student diary reviews.'
          descriptionAfter = ''
          desc = `[Before Lunch] ${descriptionBefore}`
        } else if (rand === 5) {
          status = 'Holiday'
          hours = 0
          hoursBefore = 0
          hoursAfter = 0
          desc = 'Gazetted Educational Holiday (or Medical Leave).'
        } else {
          descriptionBefore = `Conducted morning assembly. Conducted standard period classes for ${emp.role === 'Pradhan Acharya (Principal)' ? 'administrative overview' : 'assigned syllabus'}.`
          descriptionAfter = `Supervised student activities and administrative checks on class registers.`
          desc = `[Before Lunch] ${descriptionBefore} | [After Lunch] ${descriptionAfter}`
        }
        
        initialData.push({
          id: `seed-${emp.id}-${dateStr}`,
          employeeId: emp.id,
          date: dateStr,
          status,
          description: desc,
          descriptionBefore: status !== 'Holiday' ? descriptionBefore : undefined,
          descriptionAfter: status === 'Full Day' ? descriptionAfter : undefined,
          hours,
          hoursBefore: status !== 'Holiday' ? hoursBefore : undefined,
          hoursAfter: status === 'Full Day' ? hoursAfter : undefined,
          submittedAt: new Date(d.getTime() + 10 * 60 * 60 * 1000).toISOString() // submitted around 10 AM local
        })
      })
    }
    
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initialData, null, 2), 'utf-8')
  }
}

// Read database
export function readTasks(): TaskLog[] {
  initDb()
  try {
    const data = fs.readFileSync(DB_FILE_PATH, 'utf-8')
    return JSON.parse(data)
  } catch (err) {
    console.error('Failed to read task logs database:', err)
    return []
  }
}

// Write database
export function writeTasks(tasks: TaskLog[]): boolean {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(tasks, null, 2), 'utf-8')
    return true
  } catch (err) {
    console.error('Failed to write task logs database:', err)
    return false
  }
}

// Log a task
export function logEmployeeTask(
  employeeId: string,
  date: string,
  status: 'Full Day' | 'Half Day' | 'Holiday',
  description: string,
  hours: number,
  descriptionBefore?: string,
  descriptionAfter?: string,
  hoursBefore?: number,
  hoursAfter?: number
): { success: boolean; message: string; data?: TaskLog } {
  const tasks = readTasks()
  
  // Check if task already logged for this employee on this date
  const existingIndex = tasks.findIndex(
    (t) => t.employeeId === employeeId && t.date === date
  )
  
  const newTask: TaskLog = {
    id: existingIndex >= 0 ? tasks[existingIndex].id : `task-${employeeId}-${date}-${Date.now()}`,
    employeeId,
    date,
    status,
    description: description || (status === 'Holiday' ? 'On Holiday / Leave' : 'Completed scheduled tasks'),
    descriptionBefore,
    descriptionAfter,
    hours: status === 'Holiday' ? 0 : hours,
    hoursBefore: status === 'Holiday' ? 0 : hoursBefore,
    hoursAfter: status === 'Holiday' ? 0 : hoursAfter,
    submittedAt: new Date().toISOString()
  }
  
  if (existingIndex >= 0) {
    // Update existing task
    tasks[existingIndex] = newTask
  } else {
    // Add new task
    tasks.push(newTask)
  }
  
  const ok = writeTasks(tasks)
  if (ok) {
    return { success: true, message: 'Task logged successfully!', data: newTask }
  } else {
    return { success: false, message: 'Failed to write task to database.' }
  }
}
