using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Grduation_Project.Data;
using Restaurant_Graduation.DTOs;
using Restaurant_Graduation.Entites;
using Restaurant_Graduation.Interfaces;

namespace Restaurant_Graduation.Services
{
    public class InventoryTransactionService : IInventoryTransactionService
    {
        private readonly RestaurantDbContext _context;

        public InventoryTransactionService(RestaurantDbContext context)
        {
            _context = context;
        }

        public async Task<InventoryTransactionDto> AddTransactionAsync(InventoryTransaction transaction)
        {
            transaction.TransactionDate = DateTime.UtcNow;
            _context.InventoryTransactions.Add(transaction);
            await _context.SaveChangesAsync();

            return new InventoryTransactionDto
            {
                TransactionId = transaction.TransactionId,
                InventoryId = transaction.InventoryId,
                BatchId = transaction.BatchId,
                TransactionType = transaction.Type.ToString(),
                Quantity = transaction.Quantity,
                Price = transaction.Price,
                TransactionDate = transaction.TransactionDate,
                Notes = transaction.Notes
            };
        }

        public async Task<IEnumerable<InventoryTransactionDto>> GetTransactionsByInventoryIdAsync(int inventoryId, int restId)
        {
            return await _context.InventoryTransactions
                .Include(t => t.Inventory)
                .Where(t => t.InventoryId == inventoryId && t.Inventory.RestID == restId)
                .OrderByDescending(t => t.TransactionDate)
                .Select(t => new InventoryTransactionDto
                {
                    TransactionId = t.TransactionId,
                    InventoryId = t.InventoryId,
                    BatchId = t.BatchId,
                    TransactionType = t.Type.ToString(),
                    Quantity = t.Quantity,
                    Price = t.Price,
                    TransactionDate = t.TransactionDate,
                    Notes = t.Notes
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<DailyTransactionSummaryDto>> GetDailySummaryAsync(DateTime date, int restId)
        {
            var targetDate = date.Date;

            return await _context.InventoryTransactions
                .Include(t => t.Inventory)
                .Where(t => t.TransactionDate.Date == targetDate && t.Inventory.RestID == restId)
                .GroupBy(t => new { t.InventoryId, t.Inventory.ItemName })
                .Select(g => new DailyTransactionSummaryDto
                {
                    InventoryId = g.Key.InventoryId,
                    ItemName = g.Key.ItemName,
                    Date = targetDate,
                    TotalQuantityAdded = g.Where(x => x.Type == TransactionType.AddBatch).Sum(x => x.Quantity),
                    TotalQuantityConsumed = g.Where(x => x.Type == TransactionType.ConsumeBatch || x.Type == TransactionType.DisposeExpired).Sum(x => x.Quantity),
                    TotalCost = g.Where(x => x.Type == TransactionType.AddBatch).Sum(x => x.Price * x.Quantity) // Calculate total value of added batches
                })
                .ToListAsync();
        }
    }
}
