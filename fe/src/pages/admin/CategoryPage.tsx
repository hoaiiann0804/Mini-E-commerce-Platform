import React, { useState, useEffect } from 'react';
import {
  PencilIcon,
  TrashIcon,
  FolderIcon,
  ArrowPathIcon,
  FolderPlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import {
  Button,
  Input,
  Select,
  Checkbox,
  Modal,
  Textarea,
} from '@/components/common';
import { message } from 'antd';
import {
  useGetAllCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '@/services/categoryApi';
import { Category } from '@/types/category.types';

interface CategoryFormData {
  name: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

const CategoryPage: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();

  // API hooks
  const {
    data: categoriesData,
    isLoading,
    refetch,
  } = useGetAllCategoriesQuery();
  const [createCategory, { isLoading: isCreating }] =
    useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] =
    useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] =
    useDeleteCategoryMutation();

  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    image: '',
    parentId: null,
    isActive: true,
    sortOrder: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load categories
  useEffect(() => {
    if (categoriesData) {
      const categories = Array.isArray(categoriesData.data)
        ? categoriesData.data
        : [categoriesData.data];
      setCategories(categories);
    }
  }, [categoriesData]);

  // Handle form input changes
  const handleInputChange = (
    field: keyof CategoryFormData,
    value: string | boolean | number | null | undefined
  ) => {
    setFormData({
      ...formData,
      [field]: value,
    });

    // Clear error when field is changed
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: '',
      });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên danh mục không được để trống';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Open create modal
  const handleOpenCreateModal = () => {
    setFormData({
      name: '',
      description: '',
      image: '',
      parentId: null,
      isActive: true,
      sortOrder: 0,
    });
    setErrors({});
    setIsCreateModalOpen(true);
  };

  // Open edit modal
  const handleOpenEditModal = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      parentId: category.parentId,
      isActive: category.isActive,
      sortOrder: category.sortOrder || 0,
    });
    setErrors({});
    setIsEditModalOpen(true);
  };

  // Open delete modal
  const handleOpenDeleteModal = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteModalOpen(true);
  };

  // Handle create category
  const handleCreateCategory = async () => {
    if (!validateForm()) return;

    try {
      await createCategory(formData).unwrap();
      messageApi.success('Tạo danh mục thành công');
      setIsCreateModalOpen(false);
      refetch();
    } catch (error: any) {
      messageApi.error(error.data?.message || 'Có lỗi xảy ra khi tạo danh mục');
    }
  };

  // Handle update category
  const handleUpdateCategory = async () => {
    if (!validateForm() || !selectedCategory) return;

    try {
      await updateCategory({
        id: selectedCategory.id,
        ...formData,
      }).unwrap();
      messageApi.success('Cập nhật danh mục thành công');
      setIsEditModalOpen(false);
      refetch();
    } catch (error: any) {
      messageApi.error(
        error.data?.message || 'Có lỗi xảy ra khi cập nhật danh mục'
      );
    }
  };

  // Handle delete category
  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    try {
      await deleteCategory(selectedCategory.id).unwrap();
      messageApi.success('Xóa danh mục thành công');
      setIsDeleteModalOpen(false);
      refetch();
    } catch (error: any) {
      messageApi.error(error.data?.message || 'Có lỗi xảy ra khi xóa danh mục');
    }
  };

  // Toggle category expansion
  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories({
      ...expandedCategories,
      [categoryId]: !expandedCategories[categoryId],
    });
  };

  // Render category tree
  const renderCategoryTree = (categories: Category[], level = 0) => {
    return categories.map((category) => (
      <React.Fragment key={category.id}>
        <tr
          className={`border-b border-gray-200 dark:border-gray-700 ${level > 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}
        >
          <td className="px-4 py-3 text-sm">
            <div
              className="flex items-center"
              style={{ paddingLeft: `${level * 20}px` }}
            >
              {category.children && category.children.length > 0 ? (
                <button
                  onClick={() => toggleCategoryExpansion(category.id)}
                  className="mr-2 text-gray-500 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400"
                >
                  {expandedCategories[category.id] ? (
                    <ChevronDownIcon className="w-4 h-4" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <span className="w-4 h-4 mr-2"></span>
              )}
              <FolderIcon className="w-5 h-5 mr-2 text-primary-500 dark:text-primary-400" />
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {category.name}
              </span>
            </div>
          </td>
          <td className="px-4 py-3 text-sm">
            {category.description ? (
              <span className="line-clamp-1 text-gray-700 dark:text-gray-300">
                {category.description}
              </span>
            ) : (
              <span className="text-gray-400 dark:text-gray-500">
                Không có mô tả
              </span>
            )}
          </td>
          <td className="px-4 py-3 text-sm">
            {category.parentId ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                Danh mục con
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                Danh mục gốc
              </span>
            )}
          </td>
          <td className="px-4 py-3 text-sm text-center">
            {category.isActive ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                Hoạt động
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
                Ẩn
              </span>
            )}
          </td>
          <td className="px-4 py-3 text-sm text-center text-gray-700 dark:text-gray-300">
            {category.sortOrder || 0}
          </td>
          <td className="px-4 py-3 text-sm">
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => handleOpenEditModal(category)}
                className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                title="Chỉnh sửa"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleOpenDeleteModal(category)}
                className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                title="Xóa"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </td>
        </tr>
        {category.children &&
          category.children.length > 0 &&
          expandedCategories[category.id] &&
          renderCategoryTree(category.children, level + 1)}
      </React.Fragment>
    ));
  };

  // Build category options for select
  const buildCategoryOptions = (
    categories: Category[],
    level = 0,
    excludeId?: string
  ): { value: string; label: string }[] => {
    let options: { value: string; label: string }[] = [];

    categories.forEach((category) => {
      if (category.id !== excludeId) {
        options.push({
          value: category.id,
          label: '—'.repeat(level) + ' ' + category.name,
        });

        if (category.children && category.children.length > 0) {
          options = [
            ...options,
            ...buildCategoryOptions(category.children, level + 1, excludeId),
          ];
        }
      }
    });

    return options;
  };

  // Render mobile category cards
  const renderMobileCategoryCards = (categories: Category[], level = 0) => {
    return categories.map((category) => (
      <React.Fragment key={category.id}>
        <div
          className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${
            level > 0 ? 'ml-6 border-l-4 border-l-primary-500' : ''
          }`}
        >
          {/* Header with name and actions */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center flex-1">
              {category.children && category.children.length > 0 ? (
                <button
                  onClick={() => toggleCategoryExpansion(category.id)}
                  className="mr-2 text-gray-500 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400"
                >
                  {expandedCategories[category.id] ? (
                    <ChevronDownIcon className="w-5 h-5" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5" />
                  )}
                </button>
              ) : (
                <span className="w-5 h-5 mr-2"></span>
              )}
              <FolderIcon className="w-6 h-6 mr-3 text-primary-500 dark:text-primary-400" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {category.description}
                  </p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex space-x-2 ml-4">
              <button
                onClick={() => handleOpenEditModal(category)}
                className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                title="Chỉnh sửa"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleOpenDeleteModal(category)}
                className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                title="Xóa"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Category details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400 block mb-1">
                Loại:
              </span>
              {category.parentId ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                  Danh mục con
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                  Danh mục gốc
                </span>
              )}
            </div>

            <div>
              <span className="text-gray-500 dark:text-gray-400 block mb-1">
                Trạng thái:
              </span>
              {category.isActive ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                  Hoạt động
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
                  Ẩn
                </span>
              )}
            </div>

            <div>
              <span className="text-gray-500 dark:text-gray-400 block mb-1">
                Thứ tự:
              </span>
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {category.sortOrder || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Render children if expanded */}
        {category.children &&
          category.children.length > 0 &&
          expandedCategories[category.id] &&
          renderMobileCategoryCards(category.children, level + 1)}
      </React.Fragment>
    ));
  };

  // Render tablet category tree (simplified)
  const renderTabletCategoryTree = (categories: Category[], level = 0) => {
    return categories.map((category) => (
      <React.Fragment key={category.id}>
        <tr
          className={`border-b border-gray-200 dark:border-gray-700 ${level > 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}
        >
          <td className="px-4 py-3 text-sm">
            <div
              className="flex items-center"
              style={{ paddingLeft: `${level * 20}px` }}
            >
              {category.children && category.children.length > 0 ? (
                <button
                  onClick={() => toggleCategoryExpansion(category.id)}
                  className="mr-2 text-gray-500 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400"
                >
                  {expandedCategories[category.id] ? (
                    <ChevronDownIcon className="w-4 h-4" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <span className="w-4 h-4 mr-2"></span>
              )}
              <FolderIcon className="w-5 h-5 mr-2 text-primary-500 dark:text-primary-400" />
              <div className="flex-1">
                <span className="font-medium text-gray-900 dark:text-gray-100 block">
                  {category.name}
                </span>
                {category.description && (
                  <span className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                    {category.description}
                  </span>
                )}
                <div className="flex items-center space-x-2 mt-1">
                  {category.parentId ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                      Con
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                      Gốc
                    </span>
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Thứ tự: {category.sortOrder || 0}
                  </span>
                </div>
              </div>
            </div>
          </td>
          <td className="px-4 py-3 text-sm text-center">
            {category.isActive ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                Hoạt động
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
                Ẩn
              </span>
            )}
          </td>
          <td className="px-4 py-3 text-sm">
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => handleOpenEditModal(category)}
                className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                title="Chỉnh sửa"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleOpenDeleteModal(category)}
                className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                title="Xóa"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </td>
        </tr>
        {category.children &&
          category.children.length > 0 &&
          expandedCategories[category.id] &&
          renderTabletCategoryTree(category.children, level + 1)}
      </React.Fragment>
    ));
  };

  return (
    <>
      {contextHolder}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-6 space-y-8">
          {/* Header */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 opacity-90"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/30 p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
                <div className="space-y-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                    <FolderIcon className="w-6 h-6 sm:w-7 sm:h-7 mr-2 text-primary-500 dark:text-primary-400" />
                    <span className="hidden sm:inline">Quản lý danh mục</span>
                    <span className="sm:hidden">Danh mục</span>
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 hidden sm:block">
                    Tạo và quản lý các danh mục sản phẩm trong cửa hàng của bạn
                  </p>
                </div>

                <div className="flex flex-wrap items-center">
                  <Button
                    variant="primary"
                    onClick={handleOpenCreateModal}
                    className="group relative overflow-hidden bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-4 py-2.5 sm:px-7 sm:py-3.5 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 w-full sm:w-auto"
                    leftIcon={
                      <FolderPlusIcon className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform duration-300" />
                    }
                  >
                    <span className="relative z-10">
                      <span className="sm:hidden">Thêm</span>
                      <span className="hidden sm:inline">Thêm danh mục</span>
                    </span>
                    <span className="absolute inset-0 bg-white/20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/30 p-4 sm:p-6 relative z-10 overflow-visible">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">
                Danh sách danh mục
              </h2>
              <Button
                variant="outline"
                onClick={() => refetch()}
                className="flex items-center justify-center text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-700 w-full sm:w-auto"
                leftIcon={<ArrowPathIcon className="w-4 h-4" />}
              >
                <span className="sm:hidden">Làm mới</span>
                <span className="hidden sm:inline">Làm mới</span>
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-12 sm:py-20 bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                <FolderIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-400 dark:text-gray-500" />
                <h3 className="mt-4 text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                  Chưa có danh mục nào
                </h3>
                <p className="mt-2 text-sm sm:text-base text-gray-500 dark:text-gray-400 px-4">
                  Bắt đầu bằng cách tạo danh mục đầu tiên cho cửa hàng của bạn
                </p>
                <Button
                  variant="primary"
                  onClick={handleOpenCreateModal}
                  className="mt-6 group relative overflow-hidden bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-4 py-2.5 sm:px-7 sm:py-3.5 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  leftIcon={
                    <FolderPlusIcon className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform duration-300" />
                  }
                >
                  <span className="relative z-10">Tạo danh mục đầu tiên</span>
                  <span className="absolute inset-0 bg-white/20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                </Button>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden xl:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Tên danh mục
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Mô tả
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Loại
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Trạng thái
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Thứ tự
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                      {renderCategoryTree(categories)}
                    </tbody>
                  </table>
                </div>

                {/* Tablet Table View - Simplified */}
                <div className="hidden lg:block xl:hidden overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Tên danh mục
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Trạng thái
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                      {renderTabletCategoryTree(categories)}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4">
                  {renderMobileCategoryCards(categories)}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Create Category Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Tạo danh mục mới"
          size="lg"
          footer={
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isCreating}
                className="text-neutral-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-gray-800 px-5 py-2.5 rounded-xl font-medium transition-all duration-300"
              >
                <span className="inline-block">Hủy</span>
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateCategory}
                disabled={isCreating}
                className="group relative overflow-hidden bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                {isCreating ? (
                  <div className="flex items-center gap-2 relative z-10">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span className="inline-block">Đang xử lý...</span>
                  </div>
                ) : (
                  <>
                    <span className="relative z-10">Tạo danh mục</span>
                    <span className="absolute inset-0 bg-white/20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                  </>
                )}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block font-medium mb-1 text-neutral-700 dark:text-neutral-300">
                Tên danh mục <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={errors.name}
                placeholder="Nhập tên danh mục"
              />
            </div>

            <div>
              <label className="block font-medium mb-1 text-neutral-700 dark:text-neutral-300">
                Mô tả
              </label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) =>
                  handleInputChange('description', e.target.value)
                }
                placeholder="Nhập mô tả cho danh mục"
                rows={3}
              />
            </div>

            <div>
              <label className="block font-medium mb-1 text-neutral-700 dark:text-neutral-300">
                Hình ảnh
              </label>
              <Input
                value={formData.image}
                onChange={(e) => handleInputChange('image', e.target.value)}
                placeholder="Nhập URL hình ảnh"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Nhập URL hình ảnh đại diện cho danh mục
              </p>
            </div>

            <div>
              <label className="block font-medium mb-1 text-neutral-700 dark:text-neutral-300">
                Danh mục cha
              </label>
              <Select
                options={[
                  { value: '', label: 'Không có (Danh mục gốc)' },
                  ...buildCategoryOptions(categories),
                ]}
                value={formData.parentId || ''}
                onChange={(value) =>
                  handleInputChange('parentId', value === '' ? null : value)
                }
                placeholder="Chọn danh mục cha"
              />
            </div>

              <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block font-medium mb-1 text-neutral-700 dark:text-neutral-300">
                  Thứ tự sắp xếp
                </label>
                <Input
                  type="number"
                  value={(formData.sortOrder ?? 0).toString()}
                  onChange={(e) =>
                    handleInputChange(
                      'sortOrder',
                      parseInt(e.target.value) || 0
                    )
                  }
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="flex-1">
                <label className="block font-medium mb-1 text-neutral-700 dark:text-neutral-300">
                  Trạng thái
                </label>
                <div className="mt-2">
                  <Checkbox
                    checked={formData.isActive ?? true}
                    onChange={(e) =>
                      handleInputChange('isActive', e.target.checked)
                    }
                    label="Hiển thị danh mục"
                  />
                </div>
              </div>
            </div>
          </div>
        </Modal>

        {/* Edit Category Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Chỉnh sửa danh mục"
          size="lg"
          footer={
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isUpdating}
                className="text-neutral-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-gray-800 px-5 py-2.5 rounded-xl font-medium transition-all duration-300"
              >
                <span className="inline-block">Hủy</span>
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateCategory}
                disabled={isUpdating}
                className="group relative overflow-hidden bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                {isUpdating ? (
                  <div className="flex items-center gap-2 relative z-10">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span className="inline-block">Đang xử lý...</span>
                  </div>
                ) : (
                  <>
                    <span className="relative z-10">Cập nhật</span>
                    <span className="absolute inset-0 bg-white/20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                  </>
                )}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block font-medium mb-1 text-neutral-700 dark:text-neutral-300">
                Tên danh mục <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={errors.name}
                placeholder="Nhập tên danh mục"
              />
            </div>

            <div>
              <label className="block font-medium mb-1 text-neutral-700 dark:text-neutral-300">
                Mô tả
              </label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) =>
                  handleInputChange('description', e.target.value)
                }
                placeholder="Nhập mô tả cho danh mục"
                rows={3}
              />
            </div>

            <div>
              <label className="block font-medium mb-1 text-neutral-700 dark:text-neutral-300">
                Hình ảnh
              </label>
              <Input
                value={formData.image}
                onChange={(e) => handleInputChange('image', e.target.value)}
                placeholder="Nhập URL hình ảnh"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Nhập URL hình ảnh đại diện cho danh mục
              </p>
            </div>

            <div>
              <label className="block font-medium mb-1 text-neutral-700 dark:text-neutral-300">
                Danh mục cha
              </label>
              <Select
                options={[
                  { value: '', label: 'Không có (Danh mục gốc)' },
                  ...buildCategoryOptions(categories, 0, selectedCategory?.id),
                ]}
                value={formData.parentId || ''}
                onChange={(value) =>
                  handleInputChange('parentId', value === '' ? null : value)
                }
                placeholder="Chọn danh mục cha"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block font-medium mb-1 text-neutral-700 dark:text-neutral-300">
                  Thứ tự sắp xếp
                </label>
                <Input
                  type="number"
                  value={(formData.sortOrder ?? 0).toString()}
                  onChange={(e) =>
                    handleInputChange(
                      'sortOrder',
                      parseInt(e.target.value) || 0
                    )
                  }
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="flex-1">
                <label className="block font-medium mb-1 text-neutral-700 dark:text-neutral-300">
                  Trạng thái
                </label>
                <div className="mt-2">
                  <Checkbox
                    checked={formData.isActive ?? true}
                    onChange={(e) =>
                      handleInputChange('isActive', e.target.checked)
                    }
                    label="Hiển thị danh mục"
                  />
                </div>
              </div>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Xác nhận xóa danh mục"
          size="md"
          footer={
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="text-neutral-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-gray-800 px-5 py-2.5 rounded-xl font-medium transition-all duration-300"
              >
                <span className="inline-block">Hủy</span>
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteCategory}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300"
              >
                {isDeleting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span className="inline-block">Đang xử lý...</span>
                  </div>
                ) : (
                  <span className="inline-block">Xóa danh mục</span>
                )}
              </Button>
            </div>
          }
        >
          <div className="p-4 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Bạn có chắc chắn muốn xóa danh mục này?
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Danh mục{' '}
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {selectedCategory?.name}
              </span>{' '}
              sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
            </p>
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800/50 text-left">
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                <strong>Lưu ý:</strong> Bạn không thể xóa danh mục nếu:
              </p>
              <ul className="mt-2 text-sm text-yellow-700 dark:text-yellow-400 list-disc list-inside">
                <li>Danh mục có chứa danh mục con</li>
                <li>Danh mục có chứa sản phẩm</li>
              </ul>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

export default CategoryPage;
