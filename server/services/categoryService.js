import { CategoryModel } from '../models/categoryModel.js';
import { AppError } from '../middleware/errorMiddleware.js';

export const CategoryService = {
  async listCategories() {
    return CategoryModel.findAll();
  },

  async getCategoryBySlug(slug) {
    const category = await CategoryModel.findBySlug(slug);
    if (!category) {
      throw new AppError('Category not found.', 404);
    }
    return category;
  },
};
