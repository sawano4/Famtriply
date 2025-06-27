"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Edit, Trash2 } from "lucide-react"
import { ExpenseModal } from "./expense-modal"
import { itineraryService, expenseService } from "@/lib/api"
import type { Trip, DayItinerary, Expense } from "@/lib/types"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface BudgetTabProps {
  trip: Trip
  onDataRefresh: () => Promise<void>
}

interface BudgetSummary {
  totalBudget: number
  actualCost: number
  remaining: number
  percentUsed: number
  isOverBudget: boolean
}

interface CategoryBreakdown {
  restaurant: { estimated: number; actual: number }
  attraction: { estimated: number; actual: number }
  hotel: { estimated: number; actual: number }
  activity: { estimated: number; actual: number }
  other: { estimated: number; actual: number }
}

export function BudgetTab({ trip, onDataRefresh }: BudgetTabProps) {
  const [dayItineraries, setDayItineraries] = useState<DayItinerary[]>([])
  const [editing, setEditing] = useState<Expense | null>(null)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Reload data whenever the trip changes or is refreshed
    loadBudgetData()
  }, [trip.id, trip.total_expenses])

  const loadBudgetData = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("Loading budget data for trip:", trip.id)
      const data = await itineraryService.getDayItineraries(trip.id)
      setDayItineraries(data)
      await onDataRefresh() // Refresh trip data to ensure totals are updated
    } catch (error: any) {
      console.error("Error loading budget data:", error)
      setError(error.message || "Failed to load budget data")
    } finally {
      setLoading(false)
    }
  }

  const calculateBudgetSummary = (): BudgetSummary => {
    const allLocations = dayItineraries.flatMap((day) => day.locations || [])
    const allExpenses = dayItineraries.flatMap((day) => day.expenses || [])

    // Only keep the actual cost (we're removing estimated costs as requested)
    const totalSpent = allExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const totalBudget = trip.budget || 0
    const remaining = totalBudget - totalSpent
    const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
    const isOverBudget = totalSpent > totalBudget

    return {
      totalBudget,
      actualCost: totalSpent,
      remaining,
      percentUsed,
      isOverBudget,
    }
  }

  const calculateCategoryBreakdown = () => {
    const allExpenses = dayItineraries.flatMap((day) => day.expenses || [])
    
    // Create a map to store expenses by category
    const expensesByCategory: Record<string, number> = {
      food: 0,
      transport: 0,
      accommodation: 0,
      activities: 0,
      shopping: 0,
      other: 0,
    }
    
    // Sum up expenses by category
    allExpenses.forEach((expense) => {
      if (expensesByCategory[expense.category] !== undefined) {
        expensesByCategory[expense.category] += expense.amount
      } else {
        expensesByCategory.other += expense.amount
      }
    })
    
    return expensesByCategory
  }

  const handleEditExpense = (expense: Expense) => {
    // Set the expense to edit
    setEditing(expense)
    setShowExpenseModal(true)
  }
  
  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return
    
    try {
      setLoading(true)
      // Call the API to delete the expense
      await expenseService.deleteExpense(expenseId)
      // Reload budget data to reflect changes
      await loadBudgetData()
    } catch (error: any) {
      console.error("Error deleting expense:", error)
      setError(error.message || "Failed to delete expense")
    } finally {
      setLoading(false)
    }
  }

  const handleExpenseSaved = async () => {
    setShowExpenseModal(false)
    setEditing(null)
    await loadBudgetData()
    await onDataRefresh() // Refresh trip data including total expenses
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading budget data...</p>
        </div>
      </div>
    )
  }

  const budgetSummary = calculateBudgetSummary()
  const categoryBreakdown = calculateCategoryBreakdown()

  const categoryLabels = {
    food: "Food & Dining",
    transport: "Transportation",
    accommodation: "Accommodation",
    activities: "Activities & Entertainment",
    shopping: "Shopping & Souvenirs",
    other: "Other",
  }

  const categoryColors = {
    food: "text-red-600",
    transport: "text-blue-600",
    accommodation: "text-purple-600",
    activities: "text-green-600",
    shopping: "text-yellow-600",
    other: "text-gray-600",
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">TL {budgetSummary.totalBudget.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">TL {budgetSummary.actualCost.toLocaleString()}</div>
            {budgetSummary.isOverBudget && (
              <Badge variant="destructive" className="mt-2">
                Over Budget
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${budgetSummary.remaining < 0 ? "text-red-600" : "text-green-600"}`}>
              TL {Math.abs(budgetSummary.remaining).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {budgetSummary.remaining < 0 ? "Over budget" : "Under budget"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress */}
      {trip.budget && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Used: TL {budgetSummary.actualCost.toLocaleString()}</span>
                <span>{budgetSummary.percentUsed.toFixed(1)}%</span>
              </div>
              <Progress
                value={Math.min(budgetSummary.percentUsed, 100)}
                className={budgetSummary.isOverBudget ? "bg-red-100" : ""}
              />
              {budgetSummary.isOverBudget && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You are TL {(budgetSummary.actualCost - budgetSummary.totalBudget).toLocaleString()} over budget
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(calculateCategoryBreakdown()).map(([category, amount]) => {
              if (amount === 0) return null

              return (
                <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`font-medium ${categoryColors[category as keyof typeof categoryColors] || "text-gray-600"}`}>
                      {categoryLabels[category as keyof typeof categoryLabels] || "Other"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">TL {amount.toLocaleString()}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Expenses by Day */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Daily Expenses</CardTitle>
          <div className="text-sm text-muted-foreground">
            {dayItineraries.flatMap(day => day.expenses || []).length} expenses total
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dayItineraries.map((day, index) => {
              const dayExpenses = day.expenses || [];
              const dayTotal = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);

              return (
                <div key={day.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">
                      Day {index + 1} - {new Date(day.date).toLocaleDateString()}
                    </h4>
                    <div className="text-right">
                      <div className="font-medium">TL {dayTotal.toLocaleString()}</div>
                    </div>
                  </div>

                  {dayExpenses.length > 0 ? (
                    <div className="space-y-2">
                      {dayExpenses.map((expense) => (
                        <div
                          key={expense.id}
                          className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{expense.description}</div>
                            <div className="text-sm text-gray-600 capitalize">{expense.category}</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-right">
                              <div className="font-medium">TL {expense.amount.toLocaleString()}</div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditExpense(expense)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm">No expenses recorded for this day</p>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Expense Modal */}
      {showExpenseModal && (
        <ExpenseModal
          open={showExpenseModal}
          onClose={() => setShowExpenseModal(false)}
          dayItinerary={editing?.day_itinerary_id ? { id: editing.day_itinerary_id } as DayItinerary : null}
          expense={editing}
          onExpenseSaved={handleExpenseSaved}
        />
      )}
    </div>
  )
}
