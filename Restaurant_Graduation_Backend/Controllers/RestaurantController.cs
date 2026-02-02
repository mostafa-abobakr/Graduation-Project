using Microsoft.AspNetCore.Mvc;
using Restaurant_Graduation_Backend.Dtos;
using Restaurant_Graduation_Backend.Services.Interfaces;

namespace Restaurant_Graduation_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RestaurantController : ControllerBase
    {
        private readonly IRestaurantService _service;

        public RestaurantController(IRestaurantService service)
        {
            _service = service;
        }

        [HttpGet]
        public IActionResult GetAll() => Ok(_service.GetAll());

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var res = _service.GetById(id);
            if (res == null) return NotFound();
            return Ok(res);
        }

        [HttpPost]
        public IActionResult Create(RestaurantCreateDto dto)
        {
            var res = _service.Create(dto);
            return CreatedAtAction(nameof(GetById), new { id = res.RestID }, res);
        }

        [HttpPut("{id}")]
        public IActionResult Update(int id, RestaurantUpdateDto dto)
        {
            _service.Update(id, dto);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            _service.Delete(id);
            return NoContent();
        }
    }
}
