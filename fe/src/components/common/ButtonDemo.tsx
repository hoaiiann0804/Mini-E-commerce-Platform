import React from "react";
import Button from "./Button";
import IconButton from "./IconButton";
import ButtonGroup from "./ButtonGroup";

const ButtonDemo: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">Button Components</h1>

      <div className="space-y-8">
        {/* Basic Buttons */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Basic Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </div>
        </section>

        {/* Button Sizes */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Button Sizes</h2>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </section>

        {/* Loading States */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Loading States</h2>
          <div className="flex flex-wrap gap-4">
            <Button isLoading>Loading</Button>
            <Button variant="secondary" isLoading>
              Loading Secondary
            </Button>
            <Button variant="outline" isLoading>
              Loading Outline
            </Button>
          </div>
        </section>

        {/* Disabled States */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Disabled States</h2>
          <div className="flex flex-wrap gap-4">
            <Button disabled>Disabled Primary</Button>
            <Button variant="secondary" disabled>
              Disabled Secondary
            </Button>
            <Button variant="outline" disabled>
              Disabled Outline
            </Button>
          </div>
        </section>

        {/* Icon Buttons */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Icon Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <IconButton variant="primary" aria-label="Edit">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </IconButton>
            <IconButton variant="secondary" aria-label="Delete">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </IconButton>
            <IconButton variant="outline" aria-label="Settings">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </IconButton>
          </div>
        </section>

        {/* Button Groups */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Button Groups</h2>
          <div className="space-y-4">
            <ButtonGroup>
              <Button variant="outline">Left</Button>
              <Button variant="outline">Center</Button>
              <Button variant="outline">Right</Button>
            </ButtonGroup>

            <ButtonGroup>
              <IconButton variant="outline" aria-label="Bold">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"
                  />
                </svg>
              </IconButton>
              <IconButton variant="outline" aria-label="Italic">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 4l4 16"
                  />
                </svg>
              </IconButton>
              <IconButton variant="outline" aria-label="Underline">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 20h10M9 4v8a3 3 0 006 0V4"
                  />
                </svg>
              </IconButton>
            </ButtonGroup>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ButtonDemo;
