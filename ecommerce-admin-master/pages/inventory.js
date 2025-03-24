import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import axios from "axios";
import { withSwal } from 'react-sweetalert2';

function InventoryPage({ swal }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    stock: 'all',
    search: ''
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    try {
      setLoading(true);
      const response = await axios.get('/api/inventory');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateStock(productId, newQuantity) {
    try {
      await axios.put(`/api/inventory/${productId}`, {
        quantity: newQuantity
      });
      await fetchInventory();
      swal.fire({
        title: 'Success',
        text: 'Stock updated successfully',
        icon: 'success',
      });
    } catch (error) {
      swal.fire({
        title: 'Error',
        text: 'Failed to update stock',
        icon: 'error',
      });
    }
  }

  const filteredProducts = products.filter(product => {
    if (filters.status !== 'all' && product.status !== filters.status) return false;
    if (filters.stock === 'low' && product.inventory.quantity > product.inventory.lowStockThreshold) return false;
    if (filters.stock === 'out' && product.inventory.quantity > 0) return false;
    if (filters.search && !product.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <button
          onClick={fetchInventory}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full border rounded-lg p-2"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock Level
            </label>
            <select
              value={filters.stock}
              onChange={(e) => setFilters(prev => ({ ...prev, stock: e.target.value }))}
              className="w-full border rounded-lg p-2"
            >
              <option value="all">All Levels</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full border rounded-lg p-2"
            />
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center">
                  No products found
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product._id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <img
                          className="h-10 w-10 rounded object-cover"
                          src={product.images[0]}
                          alt=""
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.category?.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {product.sku}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={product.inventory.quantity}
                        onChange={(e) => {
                          const newProducts = [...products];
                          const index = newProducts.findIndex(p => p._id === product._id);
                          newProducts[index] = {
                            ...product,
                            inventory: {
                              ...product.inventory,
                              quantity: parseInt(e.target.value)
                            }
                          };
                          setProducts(newProducts);
                        }}
                        onBlur={(e) => updateStock(product._id, parseInt(e.target.value))}
                        className="w-20 border rounded p-1 text-sm"
                      />
                      {product.inventory.quantity <= product.inventory.lowStockThreshold && (
                        <span className="ml-2 text-yellow-500">⚠️ Low Stock</span>
                      )}
                      {product.inventory.quantity === 0 && (
                        <span className="ml-2 text-red-500">Out of Stock</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${product.status === 'active' ? 'bg-green-100 text-green-800' : 
                        product.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'}`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <button
                      onClick={() => {
                        swal.fire({
                          title: 'Update Stock',
                          input: 'number',
                          inputValue: product.inventory.quantity,
                          showCancelButton: true,
                          confirmButtonText: 'Update',
                          inputValidator: (value) => {
                            if (!value) {
                              return 'Please enter a value';
                            }
                            if (value < 0) {
                              return 'Stock cannot be negative';
                            }
                          }
                        }).then((result) => {
                          if (result.isConfirmed) {
                            updateStock(product._id, parseInt(result.value));
                          }
                        });
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit Stock
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

export default withSwal(InventoryPage);
