import re

with open('src/pages/tienda/AutopartesProductoDetalle.tsx', 'r') as f:
    content = f.read()

# Replace the component signature
old_sig = """export default function AutopartesProductoDetalle() {


    const [tienda, setTienda] = useState<any>(null);"""

new_sig = """export default function AutopartesProductoDetalle() {
    const { slug, id } = useParams();
    const navigate = useNavigate();

    const [tienda, setTienda] = useState<any>(null);"""

content = content.replace(old_sig, new_sig)

with open('src/pages/tienda/AutopartesProductoDetalle.tsx', 'w') as f:
    f.write(content)
