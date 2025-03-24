import { useContext, useEffect, useState } from "react";
import styled from "styled-components";
import Header from "../components/Header";
import { CartContext } from "../components/CartContext";
import axios from "axios";

const CartContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const Title = styled.h1`
  color: #333;
  margin: 20px 0;
`;

const CartGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
`;

const CartItem = styled.div`
  display: grid;
  grid-template-columns: 100px 2fr 1fr 1fr;
  gap: 20px;
  align-items: center;
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  
  img {
    max-width: 100%;
    max-height: 100px;
    object-fit: contain;
  }
  
  @media screen and (max-width: 768px) {
    grid-template-columns: 80px 1fr;
    gap: 10px;
  }
`;

const ProductInfo = styled.div`
  h3 {
    margin: 0 0 10px 0;
    font-size: 1.1rem;
  }
  
  p {
    color: #666;
    margin: 0;
  }
`;

const Price = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
  color: #008ecc;
  
  @media screen and (max-width: 768px) {
    grid-column: 2;
  }
`;

const QuantityControl = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  
  button {
    background: #008ecc;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 5px;
    cursor: pointer;
    
    &:hover {
      background: #0077aa;
    }
  }
  
  @media screen and (max-width: 768px) {
    grid-column: 2;
  }
`;

const Total = styled.div`
  margin-top: 20px;
  padding: 20px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  
  h2 {
    margin: 0 0 10px 0;
  }
  
  .amount {
    font-size: 1.5rem;
    font-weight: 600;
    color: #008ecc;
  }
`;

const CheckoutButton = styled.button`
  background: #008ecc;
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 5px;
  font-size: 1.1rem;
  cursor: pointer;
  margin-top: 20px;
  width: 100%;
  
  &:hover {
    background: #0077aa;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const EmptyCart = styled.div`
  text-align: center;
  padding: 50px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  
  h2 {
    color: #666;
    margin: 0 0 20px 0;
  }
`;

export default function CartPage() {
  const { cartProducts, addProduct, removeProduct, clearCart } = useContext(CartContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cartProducts?.length > 0) {
      setLoading(true);
      axios.post('/api/cart', { ids: cartProducts }).then(response => {
        setProducts(response.data);
        setLoading(false);
      });
    } else {
      setProducts([]);
    }
  }, [cartProducts]);

  function moreOfThisProduct(id) {
    addProduct(id);
  }

  function lessOfThisProduct(id) {
    removeProduct(id);
  }

  let total = 0;
  for (const productId of cartProducts) {
    const price = products.find(p => p._id === productId)?.price || 0;
    total += price;
  }

  if (loading) {
    return (
      <>
        <Header />
        <CartContainer>
          <Title>Loading...</Title>
        </CartContainer>
      </>
    );
  }

  if (!cartProducts?.length) {
    return (
      <>
        <Header />
        <CartContainer>
          <EmptyCart>
            <h2>Your cart is empty</h2>
            <p>Add some products to your cart to see them here!</p>
          </EmptyCart>
        </CartContainer>
      </>
    );
  }

  return (
    <>
      <Header />
      <CartContainer>
        <Title>Cart</Title>
        <CartGrid>
          {products.map(product => {
            const quantity = cartProducts.filter(id => id === product._id).length;
            if (quantity === 0) return null;
            
            return (
              <CartItem key={product._id}>
                <img src={product.images[0]} alt={product.title} />
                <ProductInfo>
                  <h3>{product.title}</h3>
                  <p>{product.description}</p>
                </ProductInfo>
                <Price>₹{product.price}</Price>
                <QuantityControl>
                  <button onClick={() => lessOfThisProduct(product._id)}>-</button>
                  <span>{quantity}</span>
                  <button onClick={() => moreOfThisProduct(product._id)}>+</button>
                </QuantityControl>
              </CartItem>
            );
          })}
        </CartGrid>
        <Total>
          <h2>Total</h2>
          <div className="amount">₹{total}</div>
          <CheckoutButton onClick={() => alert('Checkout functionality coming soon!')}>
            Proceed to Checkout
          </CheckoutButton>
        </Total>
      </CartContainer>
    </>
  );
}
