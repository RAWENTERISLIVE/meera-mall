import { useRouter } from 'next/router';

const ProductDetail = () => {
    const router = useRouter();
    const { id } = router.query;

    // Fetch product details using the id
    // This is a placeholder for the actual data fetching logic
    const product = {
        id,
        name: 'Sample Product',
        description: 'This is a sample product description.',
        price: 100,
        images: ['/path/to/image1.jpg', '/path/to/image2.jpg'],
    };

    return (
        <div>
            <h1>{product.name}</h1>
            <img src={product.images[0]} alt={product.name} />
            <p>{product.description}</p>
            <p>Price: ${product.price}</p>
            <button>Add to Cart</button>
        </div>
    );
};

export default ProductDetail;
