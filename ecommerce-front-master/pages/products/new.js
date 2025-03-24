import Header from "../../components/Header";
import ProductForm from "../../components/ProductForm";
import styled from "styled-components";

const PageContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 20px;
  text-align: center;
`;

export default function NewProduct() {
  return (
    <>
      <Header />
      <PageContainer>
        <Title>Add New Product</Title>
        <ProductForm />
      </PageContainer>
    </>
  );
}

// Add server-side authentication check if needed
export async function getServerSideProps() {
  return {
    props: {},
  };
}
