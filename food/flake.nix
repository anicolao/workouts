{
  description = "Food Project Development Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            bun
            nodejs_20 # Keep node for tool compatibility if needed, though bun is primary
            nodePackages.typescript
            nodePackages.svelte-language-server
            playwright-driver.browsers
            imagemagick
          ];

          shellHook = ''
            echo "Environment loaded for Food Project"
            echo "Bun version: $(bun --version)"
            
            # Setup Playwright browsers path if strictly needed by some tools, 
            # though usually local install handles it.
            export PLAYWRIGHT_BROWSERS_PATH=${pkgs.playwright-driver.browsers}
            export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
          '';
        };
      }
    );
}
