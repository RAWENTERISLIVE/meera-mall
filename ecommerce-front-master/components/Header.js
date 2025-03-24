import Link from "next/link";
import styled from "styled-components";
import { useContext, useState } from "react";
import { CartContext } from "./CartContext";
import BarsIcon from "./icons/Bars";

const StyledHeader = styled.header`
  background-color: #008ecc;
  padding: 20px 0;
`;

const LogoLink = styled(Link)`
  color: #fff;
  text-decoration: none;
  position: relative;
  z-index: 3;
  font-size: 1.5rem;
  font-weight: bold;
`;

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const SearchBar = styled.input`
  padding: 10px;
  border-radius: 5px;
  border: none;
  width: 300px;
  font-size: 1rem;
`;

const StyledNav = styled.nav`
  display: flex;
  gap: 20px;
  align-items: center;
  
  @media screen and (max-width: 768px) {
    display: ${props => props.mobileNavActive ? 'flex' : 'none'};
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: #008ecc;
    flex-direction: column;
    padding: 70px 20px 20px;
    z-index: 2;
  }
`;

const NavLinkStyled = styled(Link)`
  color: #fff;
  text-decoration: none;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
  
  &:hover {
    text-decoration: underline;
  }
`;

const NavButton = styled.button`
  background-color: transparent;
  width: 30px;
  height: 30px;
  border: 0;
  color: white;
  cursor: pointer;
  position: relative;
  z-index: 3;
  display: none;
  
  @media screen and (max-width: 768px) {
    display: block;
  }
`;

export default function Header() {
  const { cartProducts } = useContext(CartContext);
  const [mobileNavActive, setMobileNavActive] = useState(false);
  
  return (
    <StyledHeader>
      <Wrapper>
        <LogoLink href="/">MeeraMall</LogoLink>
        <SearchBar placeholder="Search essentials, groceries and more..." />
        <StyledNav mobileNavActive={mobileNavActive}>
          <NavLinkStyled href="/">Home</NavLinkStyled>
          <NavLinkStyled href="/products">All products</NavLinkStyled>
          <NavLinkStyled href="/categories">Categories</NavLinkStyled>
          <NavLinkStyled href="/account">Account</NavLinkStyled>
          <NavLinkStyled href="/cart">Cart ({cartProducts?.length || 0})</NavLinkStyled>
        </StyledNav>
        <NavButton onClick={() => setMobileNavActive(prev => !prev)}>
          <BarsIcon />
        </NavButton>
      </Wrapper>
    </StyledHeader>
  );
}
