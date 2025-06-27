"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { expenseService } from "@/lib/api"
import type { DayItinerary, Expense } from "@/lib/types"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ExpenseModalProps {
  open: boolean
  onClose: () => void
  dayItinerary: DayItinerary | null
  expense?: Expense | null
  onExpenseSaved: () => void
}

const expenseCategories = [
  { value: "food", label: "Food & Dining" },
  { value: "transport", label: "Transportation" },
  { value: "accommodation", label: "Accommodation" },
  { value: "activities", label: "Activities & Entertainment" },
  { value: "shopping", label: "Shopping & Souvenirs" },
  { value: "other", label: "Other" },
]

export function ExpenseModal({ open, onClose, dayItinerary, expense, onExpenseSaved }: ExpenseModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "other" as Expense["category"],
  })

  useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description,
        amount: expense.amount.toString(),
        category: expense.category,
      })
    } else {
      setFormData({
        description: "",
        amount: "",
        category: "other",
      })
    }
    setError("")
  }, [expense, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dayItinerary) return

    setLoading(true)
    setError("")

    try {
      const expenseData = {
        day_itinerary_id: dayItinerary.id,
        description: formData.description,
        amount: Number.parseFloat(formData.amount),
        category: formData.category,
      }

      let result;
      if (expense) {
        result = await expenseService.updateExpense(expense.id, expenseData)
      } else {
        result = await expenseService.createExpense(expenseData)
      }

      console.log("Expense saved successfully:", result);
      // Immediately close the modal and call the callback
      onExpenseSaved()
    } catch (err: any) {
      console.error("Error saving expense:", err)
      setError(err.message || "Failed to save expense")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <span className="mr-2">TL</span>
            {expense ? "Edit Expense" : "Add Expense"}
          </DialogTitle>
          <DialogDescription>
            {expense ? "Update expense details" : "Track a new expense for this day"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="e.g., Lunch at restaurant, Taxi ride, Museum ticket"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₺) *</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleInputChange("amount", e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {expense ? "Update Expense" : "Add Expense"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
