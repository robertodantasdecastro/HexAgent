# Contributing to HexAgentGUI

Thank you for your interest in contributing to HexAgentGUI! 

## Developer

**Primary Developer**: Roberto Dantas de Castro
- Email: robertodantasdecastro@gmail.com
- GitHub: [@robertodantasdecastro](https://github.com/robertodantasdecastro)

## How to Contribute

### Reporting Bugs

1. Check if the bug was already reported in [Issues](https://github.com/robertodantasdecastro/HexAgent/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - System information (OS, architecture, versions)
   - Logs if applicable

### Suggesting Features

1. Open an issue with tag `enhancement`
2. Describe the feature and use case
3. Explain why it would be valuable

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit with clear messages
6. Push to your fork
7. Open a Pull Request

### Code Guidelines

#### Python (Backend)

```python
# Use bilingual comments (Portuguese / English)
# Usar comentários bilíngues (Português / Inglês)

def example_function(param):
    """
    Function description / Descrição da função
    
    Args:
        param: Parameter description / Descrição do parâmetro
        
    Returns:
        Return description / Descrição do retorno
    """
    # Implementation / Implementação
    pass
```

#### JavaScript/React (Frontend)

```javascript
// Use bilingual comments (Portuguese / English)
// Usar comentários bilíngues (Português / Inglês)

/**
 * Component description / Descrição do componente
 * @param {Object} props - Component props / Props do componente
 */
const ExampleComponent = ({ props }) => {
  // Implementation / Implementação
  return <div>Example</div>;
};
```

### Testing

- Test on both Linux and macOS if possible
- Test with different architectures (ARM64, x64)
- Ensure autonomous agent loop works correctly
- Check UI responsiveness

### Documentation

- Update README.md if adding features
- Add bilingual comments (PT/EN) to code
- Update USER_MANUAL.md for user-facing changes

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/HexAgent.git
cd HexAgent/HexAgentGUI

# Install dependencies
npm install
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# Run in development mode
npm run dev
```

## Questions?

Contact Roberto Dantas de Castro:
- Email: robertodantasdecastro@gmail.com
- GitHub: [@robertodantasdecastro](https://github.com/robertodantasdecastro)

### Support

To support development (Bitcoin/PIX), please refer to the `README.md` or `USER_MANUAL.md`.

Thank you for contributing! 🛡️
