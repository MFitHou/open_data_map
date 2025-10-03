#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   OpenDataFitHou Installation Script${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Function to print colored output
print_step() {
    echo -e "${BLUE}[$1/5]${NC} $2"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if Node.js is installed
print_step "1" "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed!"
    echo "Please download and install Node.js 18+ from: https://nodejs.org/"
    echo ""
    echo "For Ubuntu/Debian:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
    echo "  sudo apt-get install -y nodejs"
    echo ""
    echo "For macOS with Homebrew:"
    echo "  brew install node"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
if [ "$MAJOR_VERSION" -lt 18 ]; then
    print_error "Node.js version must be 18 or higher!"
    echo "Current version: v$NODE_VERSION"
    echo "Please update Node.js from: https://nodejs.org/"
    exit 1
fi

print_success "Node.js v$NODE_VERSION detected"
echo ""

# Check if npm is installed
print_step "2" "Checking npm installation..."
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed!"
    echo "npm usually comes with Node.js. Please reinstall Node.js."
    exit 1
fi

NPM_VERSION=$(npm -v)
print_success "npm v$NPM_VERSION detected"
echo ""

# Check if Git is installed
print_step "3" "Checking Git installation..."
if ! command -v git &> /dev/null; then
    print_error "Git is not installed!"
    echo "Please install Git:"
    echo ""
    echo "For Ubuntu/Debian:"
    echo "  sudo apt-get install git"
    echo ""
    echo "For macOS:"
    echo "  brew install git"
    echo "  # or install Xcode Command Line Tools"
    echo ""
    echo "For other systems, visit: https://git-scm.com/"
    exit 1
fi

print_success "Git is installed"
echo ""

# Check if we're already in the project directory
if [ -f "package.json" ]; then
    print_step "4" "Already in project directory, skipping clone..."
else
    print_step "4" "Cloning repository..."
    git clone https://github.com/MFitHou/open_data_map.git
    if [ $? -ne 0 ]; then
        print_error "Failed to clone repository!"
        echo "Please check your internet connection and try again."
        exit 1
    fi
    cd open_data_map
fi

# Verify we have package.json
if [ ! -f "package.json" ]; then
    print_error "package.json not found!"
    echo "Make sure you're in the correct directory."
    exit 1
fi

print_step "5" "Installing dependencies..."
echo "This may take a few minutes..."

# Install with progress indicator
npm install --progress=true
if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies!"
    echo ""
    echo "Try these solutions:"
    echo "1. Clear npm cache: npm cache clean --force"
    echo "2. Delete node_modules: rm -rf node_modules package-lock.json"
    echo "3. Try again: npm install"
    echo "4. Use different registry: npm install --registry https://registry.npmjs.org/"
    exit 1
fi

# Verify installation
if [ -d "node_modules" ]; then
    print_success "Dependencies installed successfully"
else
    print_error "node_modules folder not found!"
    exit 1
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}    Installation completed successfully!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "To start the development server, run:"
echo -e "  ${YELLOW}npm run dev${NC}"
echo ""
echo "Then open your browser and navigate to:"
echo -e "  ${BLUE}http://localhost:5173${NC}"
echo ""
echo "Available commands:"
echo -e "  ${YELLOW}npm run dev${NC}     - Start development server"
echo -e "  ${YELLOW}npm run build${NC}   - Build for production"
echo -e "  ${YELLOW}npm run preview${NC} - Preview production build"
echo -e "  ${YELLOW}npm run lint${NC}    - Check code style"
echo ""
echo "For more information, see README.md"
echo ""