import { NavLink } from "react-router-dom";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { useState } from "react";

//import images
import pp from "@assets/images/pp.png";

const options = [
  { id: 1, name: "Вело" },
  { id: 2, name: "Скейт" },
  { id: 3, name: "Мото" },
];

export default function Footer() {
  const [selected, setSelected] = useState(options[1]);
  return (
    <footer
      className="flex flex-col mt-auto sm:flex-row sticky bottom-3 z-10 bg-gray-700 justify-between items-center rounded-lg"
    >
      <div className="flex flex-row w-full min-h-20 justify-center items-center border-gray-500 gap-2">
        {/* <div className="flex flex-1 flex-col sm:flex-row w-full justify-start items-center text-black pl-3">
          <span className="whitespace-nowrap">Copyright © | </span>
          <span className="whitespace-nowrap">ExFree 2026</span>
        </div> */}

        <div className="relative w-60 px-4">
          <Listbox value={selected} onChange={setSelected}>
            {/* Выпадающий список (позиция ВВЕРХ за счет bottom-full и mb-2) */}
            <ListboxOptions className="absolute bottom-full mb-2 w-full overflow-hidden rounded-md bg-gray-800 p-2 shadow-lg ring-1 ring-white/10 focus:outline-none">
              {options.map((item) => (
                <ListboxOption
                  key={item.id}
                  value={item}
                  className="cursor-pointer select-none rounded-md  px-3 py-2 text-sm text-gray-200 data-[focus]:bg-blue-600 data-[focus]:text-white"
                >
                  {item.name}
                </ListboxOption>
              ))}
            </ListboxOptions>

            {/* Кнопка открытия */}
            <ListboxButton className="w-full rounded-md !bg-fuchsia-600 py-2 px-3 text-left text-sm text-white border border-gray-700 hover:bg-gray-700 focus:outline-none">
              {selected.name}
            </ListboxButton>
          </Listbox>
          <p>Выбери вид экстрима</p>
        </div>

        {/* <div className="flex flex-col sm:flex-row items-center justify-center">

          <NavLink
            to="/privacy"
            className="!text-blue-800 hover:!text-blue-500 whitespace-nowrap"
          >
            Privacy /
          </NavLink>

          <NavLink
            to="/terms"
            className="!text-blue-800 hover:!text-blue-500 whitespace-nowrap"
          >
            / Terms
          </NavLink>
        </div> */}
        {/* <div className="flex flex-1 flex-col sm:flex-row sm:flex-row justify-end items-center w-1/2 sm:w-auto sm:gap-4">
          <a href="https://paypal.me/RTomayli" target="_blank">
            <img src={pp} alt="paypal" className="max-h-[40px] w-auto" />
          </a>          
        </div> */}
      </div>

      {/* <a
        href="mailto:gemdtera@gmail.com"
        target="_blank"
        rel="noopener noreferrer"
        className="!text-black  hover:!text-blue-600 my-1 pl-3 pr-3"
      >
        gemdtera@gmail.com
      </a> */}
    </footer>
  );
}
