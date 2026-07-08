using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Restaurant_Graduation.DTOs;
using Restaurant_Graduation.Entites;

namespace Restaurant_Graduation.Interfaces
{
    public interface IInventoryTransactionService
    {
        Task<InventoryTransactionDto> AddTransactionAsync(InventoryTransaction transaction);
        Task<IEnumerable<InventoryTransactionDto>> GetTransactionsByInventoryIdAsync(int inventoryId, int restId);
        Task<IEnumerable<DailyTransactionSummaryDto>> GetDailySummaryAsync(DateTime date, int restId);
    }
}
