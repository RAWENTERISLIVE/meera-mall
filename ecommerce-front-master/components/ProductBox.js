import styled from "styled-components";
import Button from "./Button";
import Link from "next/link";
import { useContext } from "react";
import { CartContext } from "./CartContext";

const ProductWrapper = styled.div`
  border: 1px solid #ddd;
  border-radius: 10px;
  overflow: hidden;
  transition: transform 0.2s;
  padding: 10px;
  background: white;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const ProductLink = styled(Link)`
  text-decoration: none;
  color: inherit;
`;

const ImageBox = styled.div`
  width: 100%;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  img {
    max-width: 100%;
    max-height: 150px;
    object-fit: contain;
  }
`;

const Title = styled.h3`
  font-weight: bold;
  font-size: 1rem;
  margin: 10px 0;
  color: #333;
`;

const PriceRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
`;

const Price = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
`;

const Discount = styled.span`
  color: #ff4646;
  font-size: 0.9rem;
  margin-left: 5px;
`;

export default function ProductBox({_id, title, price, discount, images}) {
  const { addProduct } = useContext(CartContext);
  const url = `/product/${_id}`;
  
  return (
    <ProductWrapper>
      <ProductLink href={url}>
        <ImageBox>
          <img src={images?.[0]} alt={title} />
        </ImageBox>
        <Title>{title}</Title>
      </ProductLink>
      <PriceRow>
        <div>
          <Price>₹{price}</Price>
          {discount && <Discount>{discount}% off</Discount>}
        </div>
        <Button onClick={() => addProduct(_id)} primary>
          Add to cart
        </Button>
      </PriceRow>
    </ProductWrapper>
  );
}
