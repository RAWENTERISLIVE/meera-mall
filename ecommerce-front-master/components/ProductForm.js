import { useState } from "react";
import styled from "styled-components";
import axios from "axios";

const FormContainer = styled.form`
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  color: #333;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
  min-height: 100px;
`;

const Button = styled.button`
  background-color: #008ecc;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  
  &:hover {
    background-color: #0077aa;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

export default function ProductForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [images, setImages] = useState([]);
  const [discount, setDiscount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function saveProduct(ev) {
    ev.preventDefault();
    setIsSubmitting(true);
    
    try {
      const data = {
        title,
        description,
        price: Number(price),
        images,
        discount: Number(discount),
      };
      
      await axios.post('/api/upload', data);
      
      // Reset form
      setTitle("");
      setDescription("");
      setPrice("");
      setImages([]);
      setDiscount("");
      
      alert("Product saved successfully!");
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Error saving product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function uploadImages(ev) {
    const files = ev.target?.files;
    if (files?.length > 0) {
      const data = new FormData();
      for (const file of files) {
        data.append('file', file);
      }
      try {
        const res = await axios.post('/api/upload', data);
        setImages(oldImages => [...oldImages, ...res.data.links]);
      } catch (error) {
        console.error("Error uploading images:", error);
        alert("Error uploading images. Please try again.");
      }
    }
  }

  return (
    <FormContainer onSubmit={saveProduct}>
      <FormGroup>
        <Label>Product Name</Label>
        <Input
          type="text"
          placeholder="Product name"
          value={title}
          onChange={ev => setTitle(ev.target.value)}
          required
        />
      </FormGroup>
      
      <FormGroup>
        <Label>Description</Label>
        <TextArea
          placeholder="Description"
          value={description}
          onChange={ev => setDescription(ev.target.value)}
          required
        />
      </FormGroup>
      
      <FormGroup>
        <Label>Price (in ₹)</Label>
        <Input
          type="number"
          placeholder="Price"
          value={price}
          onChange={ev => setPrice(ev.target.value)}
          required
        />
      </FormGroup>
      
      <FormGroup>
        <Label>Discount (%)</Label>
        <Input
          type="number"
          placeholder="Discount percentage"
          value={discount}
          onChange={ev => setDiscount(ev.target.value)}
        />
      </FormGroup>
      
      <FormGroup>
        <Label>Images</Label>
        <Input
          type="file"
          accept="image/*"
          onChange={uploadImages}
          multiple
        />
        {images.length > 0 && (
          <div style={{marginTop: '10px'}}>
            {images.map(link => (
              <img 
                key={link} 
                src={link} 
                alt="" 
                style={{width: '100px', height: '100px', objectFit: 'cover', marginRight: '10px'}} 
              />
            ))}
          </div>
        )}
      </FormGroup>
      
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Product"}
      </Button>
    </FormContainer>
  );
}
