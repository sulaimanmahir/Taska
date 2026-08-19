<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Expenses\StoreExpenseCategoryRequest;
use App\Http\Requests\Expenses\StoreExpenseRequest;
use App\Http\Requests\Expenses\UpdateExpenseCategoryRequest;
use App\Http\Resources\ExpenseCategoryResource;
use App\Http\Resources\ExpenseResource;
use App\Models\ApprovalRequest;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Services\ApprovalService;
use App\Services\ExpenseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExpenseController extends Controller
{
    public function __construct(
        private ApprovalService $approvalService,
        private ExpenseService $expenseService,
    ) {
    }

    public function index(Request $request)
    {
        $query = Expense::where('business_id', $request->user()->current_business_id)
            ->with('category');

        if ($request->category_id) {
            $query->where('expense_category_id', $request->category_id);
        }

        if ($request->date_from) {
            $query->whereDate('expense_date', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->whereDate('expense_date', '<=', $request->date_to);
        }

        $expenses = $query->orderByDesc('expense_date')->paginate(20);

        return response()->json($expenses);
    }

    public function store(StoreExpenseRequest $request)
    {
        $business = $request->user()->currentBusiness;
        $validated = $request->validated();

        $validated['business_id'] = $business->id;
        $validated['branch_id'] = $request->user()->current_branch_id;
        $validated['created_by'] = $request->user()->id;

        if ($this->approvalService->expenseRequiresApproval($business, (float) $validated['amount'])) {
            $approval = $this->approvalService->createRequest(
                $business,
                $request->user(),
                ApprovalRequest::TYPE_EXPENSE,
                $validated,
                "Expense of {$validated['amount']} pending approval",
                $validated['branch_id'],
            );

            return response()->json([
                'message' => 'This expense exceeds the approval threshold and is pending review by a business owner.',
                'approval_pending' => true,
                'approval' => $approval,
            ], 202);
        }

        $expense = $this->expenseService->createExpense($validated);

        return response()->json(
            (new ExpenseResource($expense->load('category')))->resolve(),
            201
        );
    }

    public function summary(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $byCategory = DB::table('expenses')
            ->join('expense_categories', 'expenses.expense_category_id', '=', 'expense_categories.id')
            ->where('expenses.business_id', $businessId)
            ->whereDate('expenses.expense_date', today())
            ->groupBy('expense_categories.id')
            ->selectRaw('expense_categories.name, SUM(expenses.amount) as total')
            ->get();

        $total = DB::table('expenses')
            ->where('business_id', $businessId)
            ->whereDate('expense_date', today())
            ->sum('amount');

        return response()->json([
            'total_today' => $total,
            'by_category' => $byCategory,
        ]);
    }

}
