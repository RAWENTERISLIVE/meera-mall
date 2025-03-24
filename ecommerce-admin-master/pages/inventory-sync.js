import Layout from "@/components/Layout";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { withSwal } from 'react-sweetalert2';
import Papa from 'papaparse';

function InventorySyncPage({ swal }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncMode, setSyncMode] = useState('manual');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const fileInput = useRef(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);
      const response = await axios.get('/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markOutOfStock(productId) {
    try {
      await axios.put(`/api/inventory-sync/${productId}`, {
        status: 'out_of_stock'
      });
      await fetchProducts();
      swal.fire({
        title: 'Success',
        text: 'Product marked as out of stock',
        icon: 'success',
      });
    } catch (error) {
      swal.fire({
        title: 'Error',
        text: 'Failed to update product status',
        icon: 'error',
      });
    }
  }

  async function markInStock(productId) {
    try {
      await axios.put(`/api/inventory-sync/${productId}`, {
        status: 'in_stock'
      });
      await fetchProducts();
      swal.fire({
        title: 'Success',
        text: 'Product marked as in stock',
        icon: 'success',
      });
    } catch (error) {
      swal.fire({
        title: 'Error',
        text: 'Failed to update product status',
        icon: 'error',
      });
    }
  }

  async function batchUpdateStatus(status) {
    if (selectedProducts.length === 0) {
      swal.fire({
        title: 'Warning',
        text: 'Please select products to update',
        icon: 'warning',
      });
      return;
    }

    try {
      await Promise.all(
        selectedProducts.map(productId =>
          axios.put(`/api/inventory-sync/${productId}`, { status })
        )
      );
      await fetchProducts();
      setSelectedProducts([]);
      swal.fire({
        title: 'Success',
        text: `${selectedProducts.length} products updated successfully`,
        icon: 'success',
      });
    } catch (error) {
      swal.fire({
        title: 'Error',
        text: 'Failed to update products',
        icon: 'error',
      });
    }
  }

  function handleProductSelect(productId) {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  }

  function handleSelectAll(event) {
    if (event.target.checked) {
      setSelectedProducts(products.map(p => p._id));
    } else {
      setSelectedProducts([]);
    }
  }

  function exportToCsv() {
    const csvData = products.map(product => ({
      ID: product._id,
      Title: product.title,
      Status: product.status,
      Category: product.category?.name || '',
      OrderThreshold: product.orderThreshold,
      RecentOrders: product.recentOrders || 0
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_status_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function handleCsvImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      Papa.parse(text, {
        header: true,
        complete: async (results) => {
          try {
            const updates = results.data.filter(row => row.ID && row.Status).map(row => ({
              id: row.ID,
              status: row.Status.toLowerCase(),
              orderThreshold: parseInt(row.OrderThreshold) || 5
            }));

            if (updates.length === 0) {
              throw new Error('No valid updates found in CSV');
            }

            await Promise.all(
              updates.map(update =>
                axios.put(`/api/inventory-sync/${update.id}`, {
                  status: update.status,
                  orderThreshold: update.orderThreshold
                })
              )
            );

            await fetchProducts();
            swal.fire({
              title: 'Success',
              text: `${updates.length} products updated from CSV`,
              icon: 'success',
            });
          } catch (error) {
            swal.fire({
              title: 'Error',
              text: error.message || 'Failed to import CSV',
              icon: 'error',
            });
          }
        },
        error: (error) => {
          swal.fire({
            title: 'Error',
            text: 'Failed to parse CSV file',
            icon: 'error',
          });
        }
      });
    } catch (error) {
      swal.fire({
        title: 'Error',
        text: 'Failed to read CSV file',
        icon: 'error',
      });
    }
    event.target.value = '';
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Stock Sync</h1>
          <p className="text-gray-600">Manage online store availability</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={syncMode}
            onChange={(e) => setSyncMode(e.target.value)}
            className="border rounded-lg p-2"
          >
            <option value="manual">Manual Control</option>
            <option value="threshold">Order Threshold</option>
          </select>
          <button
            onClick={fetchProducts}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Refresh List
          </button>
        </div>
      </div>

      {/* Batch Actions */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => batchUpdateStatus('in_stock')}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
              disabled={selectedProducts.length === 0}
            >
              Mark Selected In Stock
            </button>
            <button
              onClick={() => batchUpdateStatus('out_of_stock')}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
              disabled={selectedProducts.length === 0}
            >
              Mark Selected Out of Stock
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={exportToCsv}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              Export CSV
            </button>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvImport}
              ref={fileInput}
              className="hidden"
            />
            <button
              onClick={() => fileInput.current?.click()}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              Import CSV
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={selectedProducts.length === products.length}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              {syncMode === 'threshold' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Threshold
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Recent Orders
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center">
                  No products found
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product._id}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product._id)}
                      onChange={() => handleProductSelect(product._id)}
                    />
                  </td>
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
                  <td className="px-6 py-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      product.status === 'in_stock' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.status === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  {syncMode === 'threshold' && (
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {product.orderThreshold || 5} orders
                      <button
                        onClick={() => setThreshold(product._id, product.orderThreshold)}
                        className="ml-2 text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                    </td>
                  )}
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {product.recentOrders || 0} in last 24h
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {product.status === 'in_stock' ? (
                      <button
                        onClick={() => markOutOfStock(product._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Mark Out of Stock
                      </button>
                    ) : (
                      <button
                        onClick={() => markInStock(product._id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Mark In Stock
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">How It Works</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Manual Control</h3>
            <p className="text-gray-600">
              Manually mark products as in stock or out of stock. Use this when you want complete control over product availability.
            </p>
          </div>
          <div>
            <h3 className="font-medium">Order Threshold</h3>
            <p className="text-gray-600">
              Set a maximum number of online orders per product. The product will automatically be marked as out of stock when this threshold is reached.
            </p>
          </div>
          <div>
            <h3 className="font-medium">Batch Updates</h3>
            <p className="text-gray-600">
              Select multiple products and update their status at once. You can also import/export inventory status via CSV for bulk updates.
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-yellow-800">
              <strong>Tip:</strong> Check your physical inventory regularly and update the online store accordingly to prevent overselling.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default withSwal(InventorySyncPage);
