#!/usr/bin/env bash

set -e  # Exit immediately if a command exits with a non-zero status

# -------------------------------
# Variables
# -------------------------------
PYTHON_VERSION="3.12.11"  # Change to the version you want
NODE_VERSION="lts/*"      # Latest LTS version of Node.js

# -------------------------------
# Functions
# -------------------------------

# Update system packages
update_system() {
    echo "Updating system packages..."
    sudo apt update -y && sudo apt upgrade -y
}

# Install dependencies required for pyenv and build tools
install_build_tools() {
    echo "Installing build tools and dependencies..."
    sudo apt install -y \
        build-essential \
        curl \
        git \
        zlib1g-dev \
        libssl-dev \
        libbz2-dev \
        libreadline-dev \
        libsqlite3-dev \
        wget \
        llvm \
        libncurses5-dev \
        libncursesw5-dev \
        xz-utils \
        tk-dev \
        libffi-dev \
        liblzma-dev \
        python3-openssl \
        make
}

# Install pyenv using the official automatic installer
install_pyenv() {
    echo "Installing pyenv..."

    # Run the official pyenv automatic installer
    if ! command -v pyenv >/dev/null 2>&1; then
        curl -fsSL https://pyenv.run | bash
    else
        echo "pyenv is already installed, updating..."
        cd "$(pyenv root)" && git pull && cd -
    fi

    # Add pyenv initialization to shell configs if not already added
    if ! grep -q 'pyenv init' ~/.bashrc; then
        echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.bashrc
        echo '[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.bashrc
        echo 'eval "$(pyenv init - bash)"' >> ~/.bashrc
    fi

    # Load the updated shell configuration
    export PYENV_ROOT="$HOME/.pyenv"
    export PATH="$PYENV_ROOT/bin:$PATH"
    eval "$(pyenv init - bash)"

    # Restart the shell session
    exec "$SHELL"

    # Install Python version defined in $PYTHON_VERSION
    echo "Installing Python $PYTHON_VERSION..."
    pyenv install -s "$PYTHON_VERSION"
    pyenv global "$PYTHON_VERSION"
    pyenv rehash
}
# Install Python and pip using Ubuntu's package manager
install_python_pip() {
    echo "Installing Python and pip..."

    # Update package index
    sudo apt update -y

    # Install Python 3 and pip
    sudo apt install -y python3 python3-pip python3-venv

    # Verify installation
    echo "Python version: $(python3 --version)"
    echo "Pip version: $(pip3 --version)"
}

# Install Node.js directly from the NodeSource repository
install_node_direct() {
    echo "Installing Node.js directly..."

    # Specify Node.js version (LTS is recommended)
    NODE_VERSION="22.x"  # Change to "22.x" or other version if needed

    # Update package index
    sudo apt update -y

    # Install prerequisites
    sudo apt install -y curl software-properties-common ca-certificates

    # Add NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_$NODE_VERSION | sudo -E bash -

    # Install Node.js and npm
    sudo apt install -y nodejs

    # Verify installation
    echo "Node.js version: $(node -v)"
    echo "NPM version: $(npm -v)"
}

# Install NVM and Node.js
install_nvm_node() {
    echo "Installing NVM..."
    if [ ! -d "$HOME/.nvm" ]; then
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    else
        echo "NVM already installed, updating..."
    fi

    # Load NVM without restarting shell
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

    echo "Installing Node.js ($NODE_VERSION)..."
    nvm install "$NODE_VERSION"
    nvm use "$NODE_VERSION"
    nvm alias default "$NODE_VERSION"
}

# Install Caddy
install_caddy() {
    echo "Installing Caddy Web Server..."
    if ! command -v caddy >/dev/null 2>&1; then
        sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
        curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
        curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
        sudo apt update
        sudo apt install -y caddy
    else
        echo "Caddy is already installed, skipping..."
    fi

    echo "Enabling and starting Caddy service..."
    sudo systemctl enable caddy
    sudo systemctl start caddy
    echo "Caddy installed successfully!"
}

# -------------------------------
# Main Script
# -------------------------------
main() {
    update_system
    install_build_tools
    # install_pyenv
    install_python_pip
    # install_nvm_node
    install_node_direct
    install_caddy

    echo "--------------------------------------"
    echo "Setup complete!"
    echo "Python version: $(python --version)"
    echo "Node version: $(node --version)"
    echo "NPM version: $(npm --version)"
    echo "Caddy version: $(caddy version)"
    echo "--------------------------------------"
}

main "$@"
