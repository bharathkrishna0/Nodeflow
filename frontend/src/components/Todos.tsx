import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"

type Task = {
  id: number
  description: string
  completed: boolean
  status: "not-started" | "in-progress" | "completed"
}

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState("")

  const addTask = async () => {
    if (newTask.trim()) {
      
      setTasks([
        ...tasks,
        {
          id: tasks.length + 1,
          description: newTask,
          completed: false,
          status: "not-started",
        },
      ])
      setNewTask("")
    }
  }

  const toggleTask = (taskId: number) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              completed: !task.completed,
              status: !task.completed ? "completed" : "not-started",
            }
          : task,
      ),
    )
  }

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "not-started":
        return "text-red-500"
      case "in-progress":
        return "text-yellow-500"
      case "completed":
        return "text-green-500"
      default:
        return "text-gray-500"
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">To Do List</h1>
        <div className="flex gap-2 mb-6">
          <Input
            placeholder="Add a new task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
          />
          <Button onClick={addTask} className="dark:bg-slate-500 ">
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add task</span>
          </Button>
        </div>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3">
              <Checkbox id={`task-${task.id}`} checked={task.completed} onCheckedChange={() => toggleTask(task.id)} />
              <label
                htmlFor={`task-${task.id}`}
                className={`flex-1 ${task.completed ? "line-through text-muted-foreground" : ""}`}
              >
                {task.description}
              </label>
              <span className={`text-sm ${getStatusColor(task.status)}`}>{task.status.replace("-", " ")}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}