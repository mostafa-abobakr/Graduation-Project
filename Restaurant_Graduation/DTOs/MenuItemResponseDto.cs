namespace Restaurant_Graduation.DTOs
{
    public class MenuItemIngredientDto
    {
        public int InventoryID { get; set; }
        public string ItemName { get; set; }
        public string Unit { get; set; }
        public decimal QuantityUsed { get; set; }
    }

    public class MenuItemResponseDto
    {
        public int ItemID { get; set; }
        public int RestID { get; set; }
        public string ItemName { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }
        public decimal Cost { get; set; }
        public decimal Margin { get; set; }
        public string Category { get; set; }
        public string ImageURL { get; set; }

        public List<MenuItemIngredientDto> Ingredients { get; set; } = new List<MenuItemIngredientDto>();
    }
}
