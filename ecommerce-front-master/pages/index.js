import Header from "../components/Header";
import styled from "styled-components";
import ProductBox from "../components/ProductBox";
import { mongooseConnect } from "../lib/mongoose";
import { Product } from "../models/Product";

const StyledHome = styled.div`
  margin: 0;
  padding: 0;
`;

const ProductsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  padding: 20px;
`;

const Banner = styled.div`
  background-color: #f5f5f5;
  padding: 20px;
  text-align: center;
  margin-bottom: 20px;
  h1 {
    color: #008ecc;
    margin: 0;
  }
  p {
    color: #666;
    margin: 10px 0 0;
  }
`;

const CategorySection = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  h2 {
    color: #333;
    margin-bottom: 15px;
  }
`;

export default function HomePage({ products }) {
  return (
    <StyledHome>
      <Header />
      <Banner>
        <h1>Welcome to Our Store</h1>
        <p>Discover amazing products at great prices</p>
      </Banner>
      <CategorySection>
        <h2>Featured Products</h2>
        <ProductsGrid>
          {products?.length > 0 ? (
            products.map(product => (
              <ProductBox key={product._id} {...product} />
            ))
          ) : (
            <p>No products available.</p>
          )}
        </ProductsGrid>
      </CategorySection>
    </StyledHome>
  );
}

export async function getServerSideProps() {
  await mongooseConnect();
  
  const products = await Product.find({}, null, { sort: { '_id': -1 }, limit: 10 });

  return {
    props: {
      products: JSON.parse(JSON.stringify(products)),
    },
  };
}
