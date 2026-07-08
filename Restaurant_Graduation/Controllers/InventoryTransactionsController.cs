using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Restaurant_Graduation.DTOs;
using Restaurant_Graduation.Entites;
using Restaurant_Graduation.Interfaces;

namespace Restaurant_Graduation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InventoryTransactionsController : ControllerBase
    {
        private readonly IInventoryTransactionService _transactionService;
        private readonly IAiEngineService _aiEngineService;

        public InventoryTransactionsController(
            IInventoryTransactionService transactionService,
            IAiEngineService aiEngineService)
        {
            _transactionService = transactionService;
            _aiEngineService = aiEngineService;
        }

        // POST: api/InventoryTransactions
        [HttpPost]
        public async Task<ActionResult<InventoryTransactionDto>> LogTransaction([FromBody] InventoryTransaction transaction)
        {
            if (transaction == null)
            {
                return BadRequest("Transaction data is null.");
            }

            var createdTransaction = await _transactionService.AddTransactionAsync(transaction);
            return Ok(createdTransaction);
        }

        // GET: api/InventoryTransactions/item/5
        [HttpGet("item/{inventoryId}")]
        public async Task<ActionResult<IEnumerable<InventoryTransactionDto>>> GetItemTransactions(int inventoryId)
        {
            var transactions = await _transactionService.GetTransactionsByInventoryIdAsync(inventoryId);
            return Ok(transactions);
        }

        // GET: api/InventoryTransactions/daily-summary?date=2024-05-02
        [HttpGet("daily-summary")]
        public async Task<ActionResult<IEnumerable<DailyTransactionSummaryDto>>> GetDailySummary([FromQuery] DateTime? date)
        {
            var summaryDate = date ?? DateTime.UtcNow.Date;
            var summary = await _transactionService.GetDailySummaryAsync(summaryDate);
            return Ok(summary);
        }

        /// <summary>
        /// Uses the AI forecast dashboard (weekly) to predict next-week demand
        /// per menu item, then calculates expected inventory consumption and
        /// reorder suggestions based on inventory recipes.
        /// </summary>
        // POST: api/InventoryTransactions/forecast/{restId}
        [HttpPost("forecast/{restId}")]
        public async Task<ActionResult<InventoryForecastResponseDto>> GetInventoryForecast(
            int restId,
            [FromBody] InventoryForecastRequestDto request)
        {
            try
            {
                request ??= new InventoryForecastRequestDto();
                var result = await _aiEngineService.GetInventoryForecastAsync(restId, request);
                return Ok(result);
            }
            catch (HttpRequestException ex)
            {
                return StatusCode(502, new { error = "AI Engine unavailable", detail = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Forecast generation failed", detail = ex.Message });
            }
        }
    }
}

