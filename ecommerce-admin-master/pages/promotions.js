import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Layout from "@/components/Layout";

// Helper function to format Date object to datetime-local string
const formatDateForInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  // Adjust for timezone offset to get local time
  const offset = d.getTimezoneOffset() * 60000;
  const localDate = new Date(d.getTime() - offset);
  return localDate.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
};

export default function Promotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false); // State to track edit mode
  const [editingPromotion, setEditingPromotion] = useState(null); // State to hold promotion being edited

  const [newPromotion, setNewPromotion] = useState({
    name: '',
    code: '',
    type: 'percentage', // percentage or fixed
    value: 0,
    startDate: '',
    endDate: '',
    minOrderValue: 0,
    maxDiscount: 0
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  async function fetchPromotions() {
    // Clear messages on fetch
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const response = await axios.get('/api/promotions');
      setPromotions(response.data);
    } catch (error) {
      setError("Failed to fetch promotions");
      console.error("Error fetching promotions:", error);
    } finally {
      setLoading(false);
    }
  }

  // Clear messages after a delay
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000); // Clear after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  async function handleAddPromotion(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await axios.post('/api/promotions', newPromotion);
      setSuccess("Promotion added successfully");
      setNewPromotion({ // Reset form
        name: '',
        code: '',
        type: 'percentage',
        value: 0,
        startDate: '',
        endDate: '',
        minOrderValue: 0,
        maxDiscount: 0
      });
      fetchPromotions(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add promotion");
      console.error("Error adding promotion:", err);
    }
  }

  async function handleUpdatePromotion(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!editingPromotion) return;

    try {
      await axios.put(`/api/promotions/${editingPromotion._id}`, editingPromotion);
      setSuccess("Promotion updated successfully");
      setIsEditing(false);
      setEditingPromotion(null);
      fetchPromotions(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update promotion");
      console.error("Error updating promotion:", err);
    }
  }

  async function handleDeletePromotion(id) {
    setError(null);
    setSuccess(null);
    if (!confirm("Are you sure you want to delete this promotion?")) return;

    try {
      await axios.delete(`/api/promotions/${id}`);
      setSuccess("Promotion deleted successfully");
      fetchPromotions(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete promotion");
      console.error("Error deleting promotion:", err);
    }
  }

  // Function to start editing a promotion
  function startEditing(promotion) {
    setError(null); // Clear messages when starting edit
    setSuccess(null);
    setIsEditing(true);
    setEditingPromotion({
      ...promotion,
      // Format dates for datetime-local input
      startDate: formatDateForInput(promotion.startDate),
      endDate: formatDateForInput(promotion.endDate),
    });
  }

  // Function to cancel editing
  function cancelEditing() {
    setIsEditing(false);
    setEditingPromotion(null);
  }

  // Handle input changes for the edit form
  function handleEditInputChange(e) {
    const { name, value } = e.target;
    setEditingPromotion(prev => ({ ...prev, [name]: value }));
  }

  // Handle input changes for the add form
  function handleNewInputChange(e) {
    const { name, value } = e.target;
    setNewPromotion(prev => ({ ...prev, [name]: value }));
  }

  // Reusable Form Component (can be extracted later if needed)
  const PromotionForm = ({ promotionData, onSubmit, onCancel, onChange, isEditMode }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${isEditMode ? 'edit-' : 'new-'}name`} className="block text-sm font-medium text-gray-700">Name</label>
          <input
            id={`${isEditMode ? 'edit-' : 'new-'}name`}
            name="name"
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={promotionData.name}
            onChange={onChange}
            required
          />
        </div>
        <div>
          <label htmlFor={`${isEditMode ? 'edit-' : 'new-'}code`} className="block text-sm font-medium text-gray-700">Code</label>
          <input
            id={`${isEditMode ? 'edit-' : 'new-'}code`}
            name="code"
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={promotionData.code}
            onChange={onChange}
            required
            readOnly={isEditMode} // Make code read-only when editing
          />
        </div>
        <div>
          <label htmlFor={`${isEditMode ? 'edit-' : 'new-'}type`} className="block text-sm font-medium text-gray-700">Type</label>
          <select
            id={`${isEditMode ? 'edit-' : 'new-'}type`}
            name="type"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={promotionData.type}
            onChange={onChange}
            required
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
          </select>
        </div>
        <div>
          <label htmlFor={`${isEditMode ? 'edit-' : 'new-'}value`} className="block text-sm font-medium text-gray-700">Value</label>
          <input
            id={`${isEditMode ? 'edit-' : 'new-'}value`}
            name="value"
            type="number"
            step="0.01" // Allow decimals for fixed amounts
            min="0"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={promotionData.value}
            onChange={onChange}
            required
          />
        </div>
        <div>
          <label htmlFor={`${isEditMode ? 'edit-' : 'new-'}startDate`} className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            id={`${isEditMode ? 'edit-' : 'new-'}startDate`}
            name="startDate"
            type="datetime-local"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={promotionData.startDate}
            onChange={onChange}
            required
          />
        </div>
        <div>
          <label htmlFor={`${isEditMode ? 'edit-' : 'new-'}endDate`} className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            id={`${isEditMode ? 'edit-' : 'new-'}endDate`}
            name="endDate"
            type="datetime-local"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={promotionData.endDate}
            onChange={onChange}
            required
          />
        </div>
        <div>
          <label htmlFor={`${isEditMode ? 'edit-' : 'new-'}minOrderValue`} className="block text-sm font-medium text-gray-700">Minimum Order Value</label>
          <input
            id={`${isEditMode ? 'edit-' : 'new-'}minOrderValue`}
            name="minOrderValue"
            type="number"
            step="0.01"
            min="0"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={promotionData.minOrderValue}
            onChange={onChange}
            required
          />
        </div>
        <div>
          <label htmlFor={`${isEditMode ? 'edit-' : 'new-'}maxDiscount`} className="block text-sm font-medium text-gray-700">Maximum Discount (Optional)</label>
          <input
            id={`${isEditMode ? 'edit-' : 'new-'}maxDiscount`}
            name="maxDiscount"
            type="number"
            step="0.01"
            min="0"
            placeholder="Leave 0 for no limit"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={promotionData.maxDiscount}
            onChange={onChange}
          />
        </div>
      </div>
      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isEditMode ? 'Update Promotion' : 'Add Promotion'}
        </button>
      </div>
    </form>
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Manage Promotions</h1>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative" role="alert">
            <span className="block sm:inline">{error}</span>
            <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
              <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
            </button>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 relative" role="alert">
            <span className="block sm:inline">{success}</span>
            <button onClick={() => setSuccess(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
              <svg className="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
            </button>
          </div>
        )}

        {/* Add/Edit Form Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {isEditing ? 'Edit Promotion' : 'Add New Promotion'}
          </h2>
          {isEditing ? (
            <PromotionForm
              promotionData={editingPromotion}
              onSubmit={handleUpdatePromotion}
              onCancel={cancelEditing}
              onChange={handleEditInputChange}
              isEditMode={true}
            />
          ) : (
            <PromotionForm
              promotionData={newPromotion}
              onSubmit={handleAddPromotion}
              onCancel={null} // No cancel button for add form
              onChange={handleNewInputChange}
              isEditMode={false}
            />
          )}
        </div>

        {/* Promotions Table */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading Promotions...</p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-x-auto"> {/* Added overflow-x-auto */}
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Discount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {promotions.length === 0 && !loading && (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-gray-500">No promotions found.</td>
                  </tr>
                )}
                {promotions.map((promotion) => (
                  <tr key={promotion._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{promotion.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{promotion.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{promotion.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {promotion.type === 'percentage' ? `${promotion.value}%` : `₹${promotion.value}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(promotion.startDate).toLocaleDateString()} - {new Date(promotion.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{promotion.minOrderValue}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{promotion.maxDiscount > 0 ? `₹${promotion.maxDiscount}` : 'None'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        className="text-blue-600 hover:text-blue-900 mr-4 disabled:opacity-50"
                        onClick={() => startEditing(promotion)}
                        disabled={isEditing} // Disable edit button when another edit is active
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        onClick={() => handleDeletePromotion(promotion._id)}
                        disabled={isEditing} // Disable delete button when editing
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
