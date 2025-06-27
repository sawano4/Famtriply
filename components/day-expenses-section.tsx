"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Plus } from "lucide-react"
import type { Expense } from "@/lib/types"

interface DayExpensesSectionProps {
  expenses: Expense[]
  onEditExpense: (expense: Expense) => void
  onDeleteExpense: (expenseId: string) => void
  onAddExpense: () => void
}

const categoryLabels = {
  food: "Food",
  transport: "Transport",
  accommodation: "Accommodation",
  activities: "Activities",
  shopping: "Shopping",
  other: "Other",
}

const categoryColors = {
  food: "bg-red-100 text-red-800",
  transport: "bg-blue-100 text-blue-800",
  accommodation: "bg-purple-100 text-purple-800",
  activities: "bg-green-100 text-green-800",
  shopping: "bg-yellow-100 text-yellow-800",
  other: "bg-gray-100 text-gray-800",
}

export function DayExpensesSection({
  expenses,
  onEditExpense,
  onDeleteExpense,
  onAddExpense,
}: DayExpensesSectionProps) {
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  const expensesByCategory = expenses.reduce(
    (acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = []
      }
      acc[expense.category].push(expense)
      return acc
    },
    {} as Record<string, Expense[]>,
  )

  if (expenses.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <span className="text-4xl mb-4 block">TL</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses yet</h3>
          <p className="text-gray-600 mb-4">Track your spending for this day by adding expenses.</p>
          <Button onClick={onAddExpense}>
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">              <CardTitle className="flex items-center">
              <span className="mr-2">TL</span>
              Day Total: TL {totalAmount.toFixed(2)}
            </CardTitle>
            <Button onClick={onAddExpense} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(expensesByCategory).map(([category, categoryExpenses]) => {
              const categoryTotal = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0)
              return (
                <div key={category} className="text-center">
                  <Badge className={categoryColors[category as keyof typeof categoryColors]} variant="secondary">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </Badge>
                  <div className="mt-1 font-medium">TL {categoryTotal.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">{categoryExpenses.length} items</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Expense List */}
      <div className="space-y-3">
        {expenses
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .map((expense) => (
            <Card key={expense.id} className="group hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900">{expense.description}</h4>
                      <Badge className={categoryColors[expense.category]} variant="secondary">
                        {categoryLabels[expense.category]}
                      </Badge>
                    </div>
                    <div className="text-lg font-semibold text-green-600">TL {expense.amount.toFixed(2)}</div>
                  </div>

                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={() => onEditExpense(expense)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteExpense(expense.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  )
}
