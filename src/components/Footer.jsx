import { NavLink } from "react-router-dom";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { useTranslation } from "react-i18next";

//import images
// import pp from "@assets/images/pp.png";

export default function Footer({ selectedSport, onSportChange }) {
  const { t } = useTranslation();
  const options = [
    { id: "BMX", name: t("BMX") },
    { id: "Skate", name: t("Skate") },
    { id: "Moto", name: t("Moto") },
  ];
  const selected =
    options.find((option) => option.id === selectedSport) || options[1];
  return (
    <footer className="flex flex-col mt-auto sm:flex-row sticky bottom-0 z-10 bg-gray-700 justify-between items-center rounded-lg">
      <div className="flex flex-row w-full min-h-20 justify-center items-center border-gray-500 gap-2">
        <div className="relative w-60 px-4">
          <Listbox value={selected.id} onChange={onSportChange}>
            {/* Выпадающий список (позиция ВВЕРХ за счет bottom-full и mb-2) */}
            <ListboxOptions className="absolute bottom-full mb-2 w-full overflow-hidden rounded-md bg-gray-800 p-2 shadow-lg ring-1 ring-white/10 focus:outline-none">
              {options.map((item) => (
                <ListboxOption
                  key={item.id}
                  value={item.id}
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
          <p>{t("ChooseSport")}</p>
        </div>
      </div>
    </footer>
  );
}
