namespace Restaurant_Graduation.DTOs
{
    public class MenuItemIngredientCreateDto
    {
        public int InventoryID { get; set; }
        public decimal QuantityUsed { get; set; }
    }

    public class MenuItemCreateDto
    {
        public string ItemName { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }
        public string Category { get; set; }
        public string ImageURL { get; set; }

        public List<MenuItemIngredientCreateDto> Ingredients { get; set; } = new List<MenuItemIngredientCreateDto>();
    }
}
